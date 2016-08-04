import Ace from 'react-ace';
import classNames from 'classnames';
import {Hooks} from 'PluginSDK';
import mixin from 'reactjs-mixin';
import {Modal, Tooltip} from 'reactjs-components';
import React from 'react';
import {StoreMixin} from 'mesosphere-shared-reactjs';

import 'brace/mode/json';
import 'brace/theme/monokai';
import 'brace/ext/language_tools';

import ServiceConfig from '../../constants/ServiceConfig';
import Config from '../../config/Config';
import Icon from '../Icon';
import MarathonStore from '../../stores/MarathonStore';
import ServiceForm from '../ServiceForm';
import Service from '../../structs/Service';
import ServiceUtil from '../../utils/ServiceUtil';
import ServiceSchema from '../../schemas/ServiceSchema';
import ToggleButton from '../ToggleButton';

const METHODS_TO_BIND = [
  'getTriggerSubmit',
  'handleCancel',
  'handleClearError',
  'handleJSONChange',
  'handleJSONToggle',
  'handleSubmit',
  'onMarathonStoreServiceCreateError',
  'onMarathonStoreServiceCreateSuccess',
  'onMarathonStoreServiceEditError',
  'onMarathonStoreServiceEditSuccess'
];

const serverResponseMappings = {
  'error.path.missing': 'Specify a path',
  'error.minLength': 'Field may not be blank',
  'error.expected.jsnumber': 'A number is expected',
  'error.expected.jsstring': 'A string is expected'
};

const responseAttributePathToFieldIdMap = {
  'id': 'appId',
  'apps': 'appId',
  '/id': 'appId',
  '/acceptedResourceRoles': 'acceptedResourceRoles',
  '/cmd': 'cmd',
  '/constraints': 'constraints',
  '/constraints({INDEX})': 'constraints',
  '/container/docker/forcePullImage': 'dockerForcePullImage',
  '/container/docker/image': 'dockerImage',
  '/container/docker/network': 'dockerNetwork',
  '/container/docker/privileged': 'dockerPrivileged',
  '/container/docker/parameters({INDEX})/key':
    'dockerParameters/{INDEX}/key',
  '/container/docker/parameters': 'dockerParameters',
  '/container/docker/parameters({INDEX})/value':
    'dockerParameters/{INDEX}/value',
  '/container/volumes({INDEX})/containerPath':
    'containerVolumes/{INDEX}/containerPath',
  '/container/volumes({INDEX})/hostPath':
    'containerVolumes/{INDEX}/hostPath',
  '/container/volumes({INDEX})/mode':
    'containerVolumes/{INDEX}/mode',
  '/cpus': 'cpus',
  '/disk': 'disk',
  '/env': 'env',
  '/executor': 'executor',
  '/healthChecks({INDEX})/command/value':
    'healthChecks/{INDEX}/command',
  '/healthChecks({INDEX})/path':
    'healthChecks/{INDEX}/path',
  '/healthChecks({INDEX})/intervalSeconds':
    'healthChecks/{INDEX}/intervalSeconds',
  '/healthChecks({INDEX})/port':
    'healthChecks/{INDEX}/port',
  '/healthChecks({INDEX})/portIndex':
    'healthChecks/{INDEX}/portIndex',
  '/healthChecks({INDEX})/timeoutSeconds':
    'healthChecks/{INDEX}/timeoutSeconds',
  '/healthChecks({INDEX})/gracePeriodSeconds':
    'healthChecks/{INDEX}/gracePeriodSeconds',
  '/healthChecks({INDEX})/maxConsecutiveFailures':
    'healthChecks/{INDEX}/maxConsecutiveFailures',
  '/instances': 'instances',
  '/mem': 'mem',
  '/portDefinitions': 'portDefinitions',
  '/portDefinitions({INDEX})/name': 'portDefinitions/{INDEX}/name',
  '/portDefinitions({INDEX})/port': 'portDefinitions/{INDEX}/port',
  '/portDefinitions({INDEX})/protocol': 'portDefinitions/{INDEX}/protocol',
  '/value/isResident': 'Residency',
  '/value/upgradeStrategy': 'Update Strategy',
  '/container/docker/portMappings': 'dockerPortMappings',
  '/container/docker/portMappings({INDEX})/containerPort':
    'dockerPortMappings/{INDEX}/port',
  '/container/docker/portMappings({INDEX})/protocol':
    'dockerPortMappings/{INDEX}/protocol',
  '/container/docker/portMappings({INDEX})/hostPort': 'dockerPortMappings',
  '/container/docker/portMappings({INDEX})/servicePort': 'dockerPortMappings',
  '/labels': 'labels',
  '/uris': 'uris',
  '/user': 'user',
  '/': 'general'
};

var cleanJSONdefinition = function (jsonDefinition) {
  return Object.keys(jsonDefinition).filter(function (key) {
    return !ServiceConfig.BLACKLIST.includes(key);
  }).reduce(function (memo, key) {
    memo[key] = jsonDefinition[key];

    return memo;
  }, {});
};

class ServiceFormModal extends mixin(StoreMixin) {
  constructor() {
    super(...arguments);

    let model =
      ServiceUtil.createFormModelFromSchema(ServiceSchema);

    this.state = {
      errorMessage: null,
      jsonDefinition: JSON.stringify({id:'', cmd:''}, null, 2),
      jsonMode: false,
      model,
      pendingRequest: false,
      service: ServiceUtil.createServiceFromFormModel(model, ServiceSchema)
    };

    this.store_listeners = [
      {
        name: 'marathon',
        events: [
          'serviceCreateError',
          'serviceCreateSuccess',
          'serviceEditError',
          'serviceEditSuccess'
        ],
        suppressUpdate: true
      }
    ];

    METHODS_TO_BIND.forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(...arguments);
    if (!this.props.open && nextProps.open) {
      this.resetState(nextProps);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    let {state, props} = this;
    return props.open !== nextProps.open ||
      state.jsonMode !== nextState.jsonMode ||
      state.errorMessage !== nextState.errorMessage ||
      state.pendingRequest !== nextState.pendingRequest;
  }

  resetState(props = this.props) {
    let model = ServiceUtil.createFormModelFromSchema(ServiceSchema);
    if (props.id) {
      model.general.id = props.id;
    }
    let service = ServiceUtil.createServiceFromFormModel(
      model,
      ServiceSchema,
      this.props.isEdit
    );
    if (props.service) {
      service = props.service;
    }

    this.setState({
      errorMessage: null,
      force: false,
      jsonDefinition: service.toJSON(),
      jsonMode: false,
      model,
      pendingRequest: false,
      service
    });
  }

  handleClearError() {
    if (this.state.errorMessage == null) {
      return;
    }
    this.setState({
      errorMessage: null
    });
  }

  handleJSONChange(jsonDefinition) {
    let service = Object.assign({}, this.state.service);
    try {
      service = new Service(JSON.parse(jsonDefinition));
    } catch (e) {

    }
    this.setState({jsonDefinition, service, errorMessage: null});
  }

  handleJSONToggle() {
    let nextState = {};
    if (!this.state.jsonMode) {
      let {model} = this.triggerSubmit();
      let service = ServiceUtil.createServiceFromFormModel(
        model,
        ServiceSchema,
        this.props.isEdit,
        JSON.parse(this.state.service.toJSON())
      );
      nextState.model = model;
      nextState.service = service;
      nextState.jsonDefinition = JSON.stringify(ServiceUtil
        .getAppDefinitionFromService(service), null, 2);
    }
    nextState.jsonMode = !this.state.jsonMode;
    this.setState(nextState);
  }

  onMarathonStoreServiceCreateSuccess() {
    this.resetState();
    this.props.onClose();
  }

  onMarathonStoreServiceCreateError(errorMessage) {
    this.setState({
      errorMessage,
      pendingRequest: false
    });
  }

  shouldForceUpdate(message = this.state.errorMessage) {
    return message && message.message && /force=true/.test(message.message);
  }

  onMarathonStoreServiceEditSuccess() {
    this.resetState();
    this.props.onClose();
  }

  onMarathonStoreServiceEditError(errorMessage) {
    if (!this.props.open) {
      return;
    }
    this.setState({
      errorMessage,
      force: this.shouldForceUpdate(errorMessage),
      pendingRequest: false
    });
  }

  handleCancel() {
    this.props.onClose();
  }

  handleSubmit() {
    let marathonAction = MarathonStore.createService;

    if (this.props.isEdit) {
      marathonAction = MarathonStore.editService;
    }

    if (this.state.jsonMode) {
      let jsonDefinition = JSON.parse(this.state.jsonDefinition);
      jsonDefinition = cleanJSONdefinition(jsonDefinition);
      marathonAction(jsonDefinition, this.state.force);
      jsonDefinition = JSON.stringify(jsonDefinition, null, 2);
      this.setState({
        errorMessage: null,
        jsonDefinition,
        pendingRequest: true,
        service: new Service(jsonDefinition)
      });
      return;
    }

    if (this.triggerSubmit) {
      let {model, isValidated} = this.triggerSubmit();

      if (!isValidated) {
        return;
      }
      let service = ServiceUtil.createServiceFromFormModel(
        model,
        ServiceSchema,
        this.props.isEdit,
        JSON.parse(this.state.service.toJSON())
      );
      this.setState({
        errorMessage: null,
        model,
        pendingRequest: true,
        service
      });
      marathonAction(
        cleanJSONdefinition(ServiceUtil.getAppDefinitionFromService(service)),
        this.state.force
      );
    }
  }

  getTriggerSubmit(triggerSubmit) {
    this.triggerSubmit = triggerSubmit;
  }

  getErrorMessage() {
    let {errorMessage} = this.state;
    if (!errorMessage) {
      return null;
    }

    let errorList = null;
    if (errorMessage.details != null) {
      let responseMap = Hooks.applyFilter(
        'serviceFormErrorResponseMap',
        responseAttributePathToFieldIdMap
      );
      errorList = errorMessage.details.map(function ({path, errors}) {
        let fieldId = 'general';

        // Check if attributePath contains an index like path(0)/attribute
        // Matches as defined: [0] : '(0)', [1]: '0'
        let matches = Hooks.applyFilter('serviceFormMatchErrorPath',
          path.match(/\(([0-9]+)\)/),
          path
        );

        if (matches != null) {
          let resolvePath = responseMap[
            path.replace(matches[0], '({INDEX})')
          ];

          if (resolvePath == null) {
            resolvePath = responseMap[
              path.replace(matches[0], '{INDEX}')
            ];
          }
          if (resolvePath != null) {
            fieldId = resolvePath.replace('{INDEX}', matches[1]);
          }
        } else {
          fieldId = responseMap[path] || fieldId;
        }
        errors = errors.map(function (error) {
          if (serverResponseMappings[error]) {
            return serverResponseMappings[error];
          }
          return error;
        });

        return (
          <li key={path}>
            {`${fieldId}: ${errors}`}
          </li>
        );
      });
    }

    if (this.shouldForceUpdate(errorMessage)) {
      return (
        <div className="error-field text-danger">
          <h4 className="text-align-center text-danger flush-top">
            App is currently locked by one or more deployments. Press the button
            again to forcefully change and deploy the new configuration.
          </h4>
        </div>
      );
    }

    return (
      <div>
        <div className="error-field text-danger">
          <h4 className="text-align-center text-danger flush-top">
            {errorMessage.message}
          </h4>
          <ul>
            {errorList}
          </ul>
        </div>
      </div>
    );
  }

  getSubmitText() {
    if (this.props.isEdit) {
      return 'Deploy Changes';
    }
    return 'Deploy';
  }

  getFooter() {
    let {pendingRequest} = this.state;
    let deployButtonClassNames = classNames('button button-large flush-bottom',
      {
        'button-success': !pendingRequest,
        'disabled': pendingRequest
      }
    );

    return (
      <div className="button-collection flush-bottom">
        <button
          className="button button-large flush-top flush-bottom"
          onClick={this.handleCancel}>
          Cancel
        </button>
        <button
          className={deployButtonClassNames}
          onClick={this.handleSubmit}>
          {this.getSubmitText()}
        </button>
      </div>
    );
  }

  getModalContents() {
    let {jsonDefinition, jsonMode, service} = this.state;

    jsonDefinition = JSON.stringify(
      cleanJSONdefinition(JSON.parse(jsonDefinition)),
      null,
      2
    );

    if (jsonMode) {
      let toolTipContent = (
        <div>
          Use the JSON editor to enter Marathon Application definitions manually.
          {' '}
          <a href={`${Config.marathonDocsURI}generated/api.html#v2_apps_post`} target="_blank">
            View API docs.
          </a>
        </div>
      );

      return (
        <div className="ace-editor-container">
          <Ace editorProps={{$blockScrolling: true}}
            mode="json"
            onChange={this.handleJSONChange}
            showGutter={true}
            showPrintMargin={false}
            theme="monokai"
            height="462px"
            value={jsonDefinition}
            width="100%"/>
          <Tooltip
            content={toolTipContent}
            interactive={true}
            wrapperClassName="tooltip-wrapper media-object-item json-editor-help"
            wrapText={true}
            maxWidth={300}
            position="left"
            scrollContainer=".gm-scroll-view">
            <Icon color="grey" id="ring-question" size="mini" family="mini" />
          </Tooltip>
        </div>
      );
    }

    let model = ServiceUtil.createFormModelFromSchema(ServiceSchema, service);

    return (
      <ServiceForm
        getTriggerSubmit={this.getTriggerSubmit}
        model={model}
        onChange={this.handleClearError}
        schema={ServiceSchema}/>
    );
  }

  render() {
    let titleText = 'Deploy New Service';

    if (this.props.isEdit) {
      titleText = 'Edit Service';
    }

    let title = (
      <div className="header-flex">
        <div className="header-left">
          <span className="h4 flush-top flush-bottom text-color-neutral">
            {titleText}
          </span>
        </div>
        <div className="header-right">
          <ToggleButton
            className="modal-form-title-label"
            checkboxClassName="modal-form-title-toggle-button toggle-button"
            checked={this.state.jsonMode}
            onChange={this.handleJSONToggle}>
            JSON mode
          </ToggleButton>
        </div>
      </div>
    );

    return (
      <Modal
        backdropClass="modal-backdrop default-cursor"
        maxHeightPercentage={.9}
        bodyClass=""
        modalWrapperClass="multiple-form-modal modal-form"
        open={this.props.open}
        showCloseButton={false}
        showHeader={true}
        footer={this.getFooter()}
        scrollContainerClass=""
        titleText={title}
        titleClass="modal-header-title flush-top flush-bottom"
        showFooter={true}>
        {this.getErrorMessage()}
        {this.getModalContents()}
      </Modal>
    );
  }
}

ServiceFormModal.defaultProps = {
  isEdit: false,
  onClose: function () {},
  open: false,
  id: null,
  service: null
};

ServiceFormModal.propTypes = {
  id: React.PropTypes.string,
  isEdit: React.PropTypes.bool,
  open: React.PropTypes.bool,
  onClose: React.PropTypes.func,
  service: React.PropTypes.instanceOf(Service)
};

module.exports = ServiceFormModal;
