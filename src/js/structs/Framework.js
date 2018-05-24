import {
  ROUTE_ACCESS_PREFIX,
  FRAMEWORK_ID_VALID_CHARACTERS
} from '../constants/FrameworkConstants';
import Service from './Service';

module.exports = class Framework extends Service {
  getNodeIDs() {
    return this.get('slave_ids');
  }

  getResourceID() {
    let regexp = new RegExp(`[^${FRAMEWORK_ID_VALID_CHARACTERS}]`, 'g');
    // Strip non-alphanumeric chars from name for safety
    return ROUTE_ACCESS_PREFIX + (this.get('name') || '').replace(regexp, '');
  }

  getUsageStats(resource) {
    let value = this.get('used_resources')[resource];

    return {value};
  }

  getTasksSummary() {
    let tasksSummary = Object.assign({}, super.getTasksSummary());

    let tasksRunning = this.get('TASK_RUNNING') || 0;
    tasksSummary.tasksRunning += tasksRunning;
    tasksSummary.tasksUnknown += tasksRunning;

    return tasksSummary;
  }

  getInstancesCount() {
    let tasksRunning = this.get('TASK_RUNNING') || 0;
    return super.getInstancesCount() + tasksRunning;
  }

  getName() {
    let labels = this.getLabels();
    if (labels && labels.DCOS_PACKAGE_FRAMEWORK_NAME) {
      return labels.DCOS_PACKAGE_FRAMEWORK_NAME;
    }
    return super.getName();
  }
};