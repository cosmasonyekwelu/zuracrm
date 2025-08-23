import Contact from "../models/Contact.js";
import { listHandler, createHandler, getHandler, updateHandler, removeHandler } from "./crud.js";

export const list = listHandler(Contact, ["firstName","lastName","email","phone","company"]);
export const create = createHandler(Contact, (b, req) => ({ ...b, owner: req.user?.id }));
export const get = getHandler(Contact);
export const update = updateHandler(Contact);
export const remove = removeHandler(Contact);
