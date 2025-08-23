import mongoose from "mongoose";
const { Schema, model } = mongoose;

const IntegrationSettingsSchema = new Schema(
  {
    slack: { type: Boolean, default: false },
    zapier: { type: Boolean, default: false },
    mailchimp: { type: Boolean, default: false },
    stripe: { type: Boolean, default: false },
    emailProviders: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true }
);

export default model("IntegrationSettings", IntegrationSettingsSchema);
