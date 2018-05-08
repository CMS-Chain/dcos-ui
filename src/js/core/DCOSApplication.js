/* eslint-disable no-unused-vars */
import React from "react";
/* eslint-enable no-unused-vars */
import ReactDOM from "react-dom";
import { decorate, injectable, inject } from "inversify";
import { IntlProvider } from "react-intl";
import { RequestUtil } from "mesosphere-shared-reactjs";
import { Router, hashHistory } from "react-router";
import { Provider } from "react-redux";
import PluginSDK from "PluginSDK";

// Load in our CSS.
// TODO - DCOS-6452 - remove component @imports from index.less and
// require them in the component.js
import "../../styles/index.less";
import "../utils/MomentJSConfig";
import { CONFIG_ERROR } from "../constants/EventTypes";
import ApplicationUtil from "../utils/ApplicationUtil";
import appRoutes from "../routes/index";
import ConfigStore from "../stores/ConfigStore";
import RequestErrorMsg from "../components/RequestErrorMsg";

// Translations
import enUS from "../translations/en-US.json";

const domElement = global.document.getElementById("application");
const navigatorLanguage = "en-US";

// TODO: Implement loader that can concat many sprites into a single one
// We opt to load the sprite after the Javscript files are parsed because it
// is quite expensive for the browser to parse a sprite file. This way we
// don't block the JS execution.
setTimeout(function() {
  var ajax = new XMLHttpRequest();
  ajax.open("GET", "sprite.svg", true);
  ajax.send();
  ajax.onload = function() {
    var div = global.document.createElement("div");
    div.innerHTML = ajax.responseText;
    div.style.height = 0;
    div.style.overflow = "hidden";
    div.style.width = 0;
    div.style.visibility = "hidden";
    global.document.body.insertBefore(div, global.document.body.childNodes[0]);
  };
});

// Patch json
const oldJSON = RequestUtil.json;
RequestUtil.json = function(options = {}) {
  // Proxy error function so that we can trigger a plugin event
  const oldHandler = options.error;
  options.error = function() {
    if (typeof oldHandler === "function") {
      oldHandler.apply(null, arguments);
    }
    PluginSDK.Hooks.doAction("AJAXRequestError", ...arguments);
  };

  oldJSON(options);
};

export default class DCOSApplication {
  constructor(routingService, navigationService) {
    this._routingService = routingService;
    this._navigationService = navigationService;
  }

  onStart() {
    if (!global.Intl) {
      require.ensure(["intl", "intl/locale-data/jsonp/en.js"], function(
        require
      ) {
        require("intl");
        require("intl/locale-data/jsonp/en.js");

        this.startApplication();
      });
    } else {
      this.startApplication();
    }
  }

  renderAppToDOM(content) {
    ReactDOM.render(content, domElement, function() {
      PluginSDK.Hooks.doAction("applicationRendered");
    });
  }

  renderApplicationToDOM() {
    const routes = appRoutes.getRoutes(this._routingService);

    this.renderAppToDOM(
      <Provider store={PluginSDK.Store}>
        <IntlProvider locale={navigatorLanguage} messages={enUS}>
          <Router history={hashHistory} routes={routes} />
        </IntlProvider>
      </Provider>
    );

    PluginSDK.Hooks.doAction("routes", routes);
  }

  renderApplication() {
    // Allow overriding of application contents
    const contents = PluginSDK.Hooks.applyFilter("applicationContents", null);
    if (contents) {
      this.renderAppToDOM(contents);
    } else if (PluginSDK.Hooks.applyFilter("delayApplicationLoad", true)) {
      // Let's make sure we get Mesos Summary data before we render app
      // Mesos may unreachable, so we will render even on request failure
      ApplicationUtil.beginTemporaryPolling(() => {
        ApplicationUtil.invokeAfterPageLoad(
          this.renderApplicationToDOM.bind(this)
        );
      });
    } else {
      this.renderApplicationToDOM.bind(this)();
    }
  }

  onPluginsLoaded() {
    PluginSDK.Hooks.removeAction(
      "pluginsConfigured",
      this.onPluginsLoaded.bind(this)
    );
    ConfigStore.removeChangeListener(
      CONFIG_ERROR,
      this.onConfigurationError.bind(this)
    );
    this.renderApplication();
  }

  onConfigurationError() {
    // Try to find appropriate DOM element or fallback
    const element = global.document.querySelector("#canvas div") || domElement;
    const columnClasses = {
      "column-small-8": false,
      "column-small-offset-2": false,
      "column-medium-6": false,
      "column-medium-offset-3": false
    };

    ReactDOM.render(
      <RequestErrorMsg
        columnClasses={columnClasses}
        header="Error requesting UI Configuration"
      />,
      element
    );
  }

  startApplication() {
    // Plugins events
    PluginSDK.Hooks.addAction(
      "pluginsConfigured",
      this.onPluginsLoaded.bind(this)
    );
    ConfigStore.addChangeListener(
      CONFIG_ERROR,
      this.onConfigurationError.bind(this)
    );

    // Load configuration
    ConfigStore.fetchConfig();
  }
}
decorate(injectable(), DCOSApplication);
decorate(inject("RoutingService"), DCOSApplication, 0);
decorate(inject("NavigationService"), DCOSApplication, 1);
