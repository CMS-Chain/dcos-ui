import PropTypes from "prop-types";
import React from "react";

import { findNestedPropertyInObject } from "#SRC/js/utils/Util";
import FieldHelp from "#SRC/js/components/form/FieldHelp";
import FieldInput from "#SRC/js/components/form/FieldInput";
import FieldLabel from "#SRC/js/components/form/FieldLabel";

const getForcePullSection = function(data, path) {
  const imageForcePullPath = `${path}.image.forcePull`;
  const imageForcePull = findNestedPropertyInObject(data, imageForcePullPath);

  return (
    <FieldLabel>
      <FieldInput
        checked={imageForcePull}
        name={imageForcePullPath}
        type="checkbox"
        value={imageForcePull}
      />
      Force Pull Image On Launch
      <FieldHelp>
        Force Docker to pull the image before launching each instance.
      </FieldHelp>
    </FieldLabel>
  );
};

const MultiContainerFormAdvancedSection = ({ data, path }) => {
  return (
    <div>
      <h2 className="short-top short-bottom">
        Advanced Settings
      </h2>
      <p>Advanced settings of the container.</p>
      <p>
        {getForcePullSection(data, path)}
      </p>
    </div>
  );
};

MultiContainerFormAdvancedSection.defaultProps = {
  data: {},
  path: "container"
};

MultiContainerFormAdvancedSection.propTypes = {
  data: PropTypes.object,
  path: PropTypes.string
};

module.exports = MultiContainerFormAdvancedSection;
