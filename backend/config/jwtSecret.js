// Single source of truth for the JWT secret.
// Previously this was hardcoded (and duplicated with a typo) in three
// separate files: userController.js, authenticationMiddleware.js, and
// socketHandler.js. Now all three import it from here, and the real
// value lives only in .env (which is gitignored).

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not set. Add it to Backend/.env (see .env.example).",
  );
}

module.exports = JWT_SECRET;
