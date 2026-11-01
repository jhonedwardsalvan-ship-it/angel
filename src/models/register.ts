import { deleteModel, model, models, type Model, type Schema } from "mongoose";

// No "server-only" or "@/" imports: scripts may load model files directly.

/**
 * Registers a model once per process. In development, hot reload re-runs model
 * files after an edit; the cached model is replaced so schema changes apply
 * without restarting the dev server.
 *
 * Deliberately untyped: generic Mongoose model types make tsc run out of
 * memory. Callers cast the result to their concrete Model<…Doc>.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerModel(name: string, schema: Schema<any>): Model<any, any, any, any> {
  if (models[name]) {
    if (process.env.NODE_ENV === "production") return models[name];
    deleteModel(name);
  }
  return model(name, schema);
}
