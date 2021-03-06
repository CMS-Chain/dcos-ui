import isEqual from "lodash.isequal";
import { List } from "reactjs-components";
import PropTypes from "prop-types";
import React from "react";
import { Link, routerShape } from "react-router";

import StringUtil from "#SRC/js/utils/StringUtil";
import ServiceStatusIcon from "./ServiceStatusIcon";

const ServiceList = React.createClass({
  displayName: "ServiceList",

  propTypes: {
    services: PropTypes.array.isRequired
  },

  contextTypes: {
    router: routerShape
  },

  getDefaultProps() {
    return {
      services: []
    };
  },

  shouldComponentUpdate(nextProps, nextState) {
    var changedState =
      nextState !== undefined && !isEqual(this.state, nextState);

    return !isEqual(this.props, nextProps) || changedState;
  },

  handleServiceClick(service, event) {
    // Open service in new window/tab if service has a web URL
    if (
      service.getWebURL() &&
      (event.ctrlKey || event.shiftKey || event.metaKey)
    ) {
      return;
    }
    const id = encodeURIComponent(service.getId());
    // Modifier key not pressed or service didn't have a web URL, open detail
    event.preventDefault();
    this.context.router.push(`/services/detail/${id}`);
  },

  getServices(services) {
    return services.map(service => {
      const instancesCount = service.getInstancesCount();
      const runningInstances = service.getRunningInstancesCount();
      const tooltipContent = `${runningInstances} ${StringUtil.pluralize("instance", runningInstances)} running out of ${instancesCount}`;

      return {
        content: [
          {
            className: "dashboard-health-list-item-description text-overflow",
            content: (
              <a
                key="title"
                onClick={this.handleServiceClick.bind(this, service)}
                href={service.getWebURL()}
                className="dashboard-health-list-item-cell emphasis"
              >
                {service.getName()}
              </a>
            ),
            tag: "span"
          },
          {
            className: "dashboard-health-list-health-label",
            content: (
              <ServiceStatusIcon
                key="icon"
                service={service}
                showTooltip={true}
                tooltipContent={tooltipContent}
              />
            ),
            tag: "div"
          }
        ]
      };
    });
  },

  getNoServicesMessage() {
    return (
      <div>
        <h3 className="flush-top text-align-center">No Services Running</h3>
        <p className="flush text-align-center">
          {"Click the "}
          <Link to="/services">Services tab</Link>
          {" to install services."}
        </p>
      </div>
    );
  },

  getList() {
    const props = this.props;

    return (
      <div className="dashboard-health-list">
        <List
          className="list list-unstyled"
          content={this.getServices(props.services)}
          transition={false}
          transitionName="something"
        />
      </div>
    );
  },

  getContent() {
    if (this.props.services.length === 0) {
      return this.getNoServicesMessage();
    } else {
      return this.getList();
    }
  },

  render() {
    return this.getContent();
  }
});

module.exports = ServiceList;
