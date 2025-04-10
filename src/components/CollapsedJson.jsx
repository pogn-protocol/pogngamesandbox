import React from "react";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

const CollapsedJson = ({ data }) => (
  <JsonView
    data={data}
    shouldExpandNode={(level, value, field) =>
      level === 0 || field === "payload"
    }
  />
);

export default CollapsedJson;
