import React, { useCallback, useEffect, useReducer } from "react";

import boardContext from "./board-context";
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS, SOCKET_EVENTS } from "../constants";
import {
  createElement,
  getSvgPathFromStroke,
  isPointNearElement,
  rehydrateElement,
  serializeElement,
  generateElementId,
} from "../utils/element";
import getStroke from "perfect-freehand";
import { getSocket } from "../utils/socket";

const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL: {
      return {
        ...state,
        activeToolItem: action.payload.tool,
      };
    }
    case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
      return {
        ...state,
        toolActionType: action.payload.actionType,
      };
    case BOARD_ACTIONS.DRAW_DOWN: {
      const { clientX, clientY, stroke, fill, size } = action.payload;
      const newElement = createElement(
        generateElementId(),
        clientX,
        clientY,
        clientX,
        clientY,
        { type: state.activeToolItem, stroke, fill, size },
      );
      const prevElements = state.elements;
      return {
        ...state,
        toolActionType:
          state.activeToolItem === TOOL_ITEMS.TEXT
            ? TOOL_ACTION_TYPES.WRITING
            : TOOL_ACTION_TYPES.DRAWING,
        elements: [...prevElements, newElement],
      };
    }
    case BOARD_ACTIONS.DRAW_MOVE: {
      const { clientX, clientY } = action.payload;
      const newElements = [...state.elements];
      const index = state.elements.length - 1;
      const { type } = newElements[index];
      switch (type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          const { x1, y1, stroke, fill, size, id } = newElements[index];
          const newElement = createElement(id, x1, y1, clientX, clientY, {
            type: state.activeToolItem,
            stroke,
            fill,
            size,
          });
          newElements[index] = newElement;
          return {
            ...state,
            elements: newElements,
          };
        case TOOL_ITEMS.BRUSH:
          newElements[index].points = [
            ...newElements[index].points,
            { x: clientX, y: clientY },
          ];
          newElements[index].path = new Path2D(
            getSvgPathFromStroke(getStroke(newElements[index].points)),
          );
          return {
            ...state,
            elements: newElements,
          };
        default:
          throw new Error("Type not recognized");
      }
    }
    case BOARD_ACTIONS.DRAW_UP: {
      const elementsCopy = [...state.elements];
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(elementsCopy);
      return {
        ...state,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.ERASE: {
      const { clientX, clientY } = action.payload;
      let newElements = [...state.elements];
      newElements = newElements.filter((element) => {
        return !isPointNearElement(element, clientX, clientY);
      });
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return {
        ...state,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.CHANGE_TEXT: {
      const index = state.elements.length - 1;
      const newElements = [...state.elements];
      newElements[index].text = action.payload.text;
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.NONE,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.UNDO: {
      if (state.index <= 0) return state;
      return {
        ...state,
        elements: state.history[state.index - 1],
        index: state.index - 1,
      };
    }
    case BOARD_ACTIONS.REDO: {
      if (state.index >= state.history.length - 1) return state;
      return {
        ...state,
        elements: state.history[state.index + 1],
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.SET_ELEMENT: {
      const incoming = action.payload.element;
      const existingIndex = state.elements.findIndex(
        (el) => el.id === incoming.id,
      );
      const newElements =
        existingIndex === -1
          ? [...state.elements, incoming]
          : state.elements.map((el, i) =>
              i === existingIndex ? incoming : el,
            );
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return {
        ...state,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.REMOVE_ELEMENT: {
      const { elementId } = action.payload;
      const newElements = state.elements.filter((el) => el.id !== elementId);
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return {
        ...state,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }
    default:
      return state;
  }
};

const rehydrateElements = (elements) => {
  if (!Array.isArray(elements)) {
    return [];
  }
  return elements.map(rehydrateElement);
};

const getInitialBoardState = (initialElements) => {
  const elements = rehydrateElements(initialElements);
  return {
    activeToolItem: TOOL_ITEMS.BRUSH,
    toolActionType: TOOL_ACTION_TYPES.NONE,
    elements,
    history: [elements],
    index: 0,
  };
};

const BoardProvider = ({ children, initialElements = [], canvasId }) => {
  const [boardState, dispatchBoardAction] = useReducer(
    boardReducer,
    initialElements,
    getInitialBoardState,
  );

  useEffect(() => {
    if (!canvasId) return undefined;

    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.JOIN_CANVAS, { canvasId });

    const handleRemoteElement = ({ element }) => {
      dispatchBoardAction({
        type: BOARD_ACTIONS.SET_ELEMENT,
        payload: { element: rehydrateElement(element) },
      });
    };

    const handleRemoteElementDelete = ({ elementId }) => {
      dispatchBoardAction({
        type: BOARD_ACTIONS.REMOVE_ELEMENT,
        payload: { elementId },
      });
    };

    const handleCanvasError = (error) => {
      console.error("Canvas socket error:", error?.message);
    };

    socket.on(SOCKET_EVENTS.ELEMENT_UPDATE, handleRemoteElement);
    socket.on(SOCKET_EVENTS.ELEMENT_DELETE, handleRemoteElementDelete);
    socket.on(SOCKET_EVENTS.CANVAS_ERROR, handleCanvasError);

    return () => {
      socket.off(SOCKET_EVENTS.ELEMENT_UPDATE, handleRemoteElement);
      socket.off(SOCKET_EVENTS.ELEMENT_DELETE, handleRemoteElementDelete);
      socket.off(SOCKET_EVENTS.CANVAS_ERROR, handleCanvasError);
    };
  }, [canvasId]);

  const changeToolHandler = (tool) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TOOL,
      payload: {
        tool,
      },
    });
  };

  const boardMouseDownHandler = (event, toolboxState) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;
    if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: {
          actionType: TOOL_ACTION_TYPES.ERASING,
        },
      });
      return;
    }
    dispatchBoardAction({
      type: BOARD_ACTIONS.DRAW_DOWN,
      payload: {
        clientX,
        clientY,
        stroke: toolboxState[boardState.activeToolItem]?.stroke,
        fill: toolboxState[boardState.activeToolItem]?.fill,
        size: toolboxState[boardState.activeToolItem]?.size,
      },
    });
  };

  const boardMouseMoveHandler = (event) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_MOVE,
        payload: {
          clientX,
          clientY,
        },
      });
    } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      const removedElements = boardState.elements.filter((element) =>
        isPointNearElement(element, clientX, clientY),
      );

      dispatchBoardAction({
        type: BOARD_ACTIONS.ERASE,
        payload: {
          clientX,
          clientY,
        },
      });

      if (canvasId && removedElements.length > 0) {
        const socket = getSocket();
        removedElements.forEach((element) => {
          socket.emit(SOCKET_EVENTS.ELEMENT_DELETE, {
            canvasId,
            elementId: element.id,
          });
        });
      }
    }
  };

  const boardMouseUpHandler = () => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_UP,
      });

      const finishedElement =
        boardState.elements[boardState.elements.length - 1];

      if (canvasId && finishedElement) {
        getSocket().emit(SOCKET_EVENTS.ELEMENT_UPDATE, {
          canvasId,
          element: serializeElement(finishedElement),
        });
      }
    }
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: {
        actionType: TOOL_ACTION_TYPES.NONE,
      },
    });
  };

  const textAreaBlurHandler = (text) => {
    const index = boardState.elements.length - 1;
    const finishedElement = boardState.elements[index];

    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TEXT,
      payload: {
        text,
      },
    });

    if (canvasId && finishedElement) {
      getSocket().emit(SOCKET_EVENTS.ELEMENT_UPDATE, {
        canvasId,
        element: serializeElement({ ...finishedElement, text }),
      });
    }
  };

  const boardUndoHandler = useCallback(() => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.UNDO,
    });
  }, []);

  const boardRedoHandler = useCallback(() => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.REDO,
    });
  }, []);

  const boardContextValue = {
    activeToolItem: boardState.activeToolItem,
    elements: boardState.elements,
    toolActionType: boardState.toolActionType,
    changeToolHandler,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    undo: boardUndoHandler,
    redo: boardRedoHandler,
  };

  return (
    <boardContext.Provider value={boardContextValue}>
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;