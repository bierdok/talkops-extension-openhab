import { Extension, Readme, Service } from "talkops";

const extension = new Extension("OpenHAB");

extension.setDockerRepository("bierdok/talkops-extension-openhab");

extension.setDescription(`
This Extension based on [OpenHAB](https://www.openhab.org/) allows you to **control your smart home by voice in realtime**.

Features:
* Switchs: Check status, turn on/off
* Shutters: Check status, open, close and stop
`);

extension.setInstallationGuide(`
* [Generate an API token](https://www.openhab.org/docs/configuration/apitokens.html#generate-an-api-token)
`);

extension.setEnvironmentVariables({
  BASE_URL: {
    description: "The base URL of your OpenHAB server.",
    possibleValues: ["http://openhab:8080", "https://openhab.mydomain.net"],
  },
  API_TOKEN: {
    description: "The copied API token.",
  },
});

const baseInstructions = `
You are a home automation assistant, focused solely on managing connected devices in the home.
When asked to calculate an average, **round to the nearest whole number** without explaining the calculation.
`;

const defaultInstructions = `
Currently, there is no connected devices.
Your sole task is to ask the user to install one or more connected devices in the home before proceeding.
`;

import axios from "axios";
import yaml from "js-yaml";

import locationsModel from "./schemas/models/locations.json" with { type: "json" };
import switchsModel from "./schemas/models/switchs.json" with { type: "json" };
import shuttersModel from "./schemas/models/shutters.json" with { type: "json" };

import updateSwitchsFunction from "./schemas/functions/update_switchs.json" with { type: "json" };
import updateShuttersFunction from "./schemas/functions/update_shutters.json" with { type: "json" };

async function getSystemInfo() {
  try {
    const response = await axios.get(
      `${process.env.BASE_URL}/rest/systeminfo`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
      }
    );
    return response.data.systemInfo;
  } catch (err) {
    extension.errors = [err.message];
    return {};
  }
}

async function getItems() {
  try {
    const response = await axios.get(`${process.env.BASE_URL}/rest/items`, {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    });
    return response.data;
  } catch (err) {
    extension.errors = [err.message];
    return [];
  }
}

async function refresh() {
  const locations = [];
  const switchs = [];
  const shutters = [];
  extension.errors = [];
  const systemInfo = await getSystemInfo();
  extension.setVersion(systemInfo.osVersion);
  for (const item of await getItems()) {
    if (item.type === "Group" && item.tags.includes("Location")) {
      locations.push({
        id: item.name,
        name: item.label,
        location_id: item.groupNames.length ? item.groupNames[0] : null,
      });
    }
    if (item.type === "Switch" && item.tags.includes("Equipment")) {
      switchs.push({
        id: item.name,
        name: item.label,
        state: item.state.toLowerCase(),
        location_id: item.groupNames.length ? item.groupNames[0] : null,
      });
    }
    if (item.type === "Rollershutter" && item.tags.includes("Equipment")) {
      shutters.push({
        id: item.name,
        name: item.label,
        state: item.state === "0" ? "opened" : "closed",
        location_id: item.groupNames.length ? item.groupNames[0] : null,
      });
    }
  }

  extension.setInstructions(() => {
    const instructions = [baseInstructions];

    if (!switchs.length && !shutters.length) {
      instructions.push(defaultInstructions);
    } else {
      instructions.push("``` yaml");
      instructions.push(
        yaml.dump({
          locationsModel,
          switchsModel,
          shuttersModel,
          locations,
          switchs,
          shutters,
        })
      );
      instructions.push("```");
    }

    return instructions;
  });

  extension.setFunctionSchemas(() => {
    const functionSchemas = [];
    if (switchs.length) {
      functionSchemas.push(updateSwitchsFunction);
    }
    if (shutters.length) {
      functionSchemas.push(updateShuttersFunction);
    }
    return functionSchemas;
  });

  setTimeout(refresh, 5000);
}
refresh();

extension.setFunctions([
  async function update_switchs(action, ids) {
    try {
      for (const id of ids) {
        await axios.post(
          `${process.env.BASE_URL}/rest/items/${id}`,
          action.toUpperCase(),
          {
            headers: {
              Authorization: `Bearer ${process.env.API_TOKEN}`,
              "content-type": "text/plain",
            },
          }
        );
      }
      return "Done.";
    } catch (err) {
      return `Error: ${err.message}`;
    }
  },
  async function update_shutters(action, ids) {
    try {
      for (const id of ids) {
        await axios.post(
          `${process.env.BASE_URL}/rest/items/${id}`,
          action.toUpperCase(),
          {
            headers: {
              Authorization: `Bearer ${process.env.API_TOKEN}`,
              "content-type": "text/plain",
            },
          }
        );
      }
      return action === "stop" ? "Done." : "In progress.";
    } catch (err) {
      console.log(err);
      return `Error: ${err.message}`;
    }
  },
]);

new Readme(process.env.README_TEMPLATE_URL, "/app/README.md", extension);
new Service(process.env.AGENT_URLS.split(","), extension);
