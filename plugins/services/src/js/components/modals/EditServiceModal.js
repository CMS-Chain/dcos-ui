import React, { Component } from "react";

import EditFrameworkConfiguration
  from "#PLUGINS/services/src/js/pages/EditFrameworkConfiguration";
import CreateServiceModal
  from "#PLUGINS/services/src/js/components/modals/CreateServiceModal";
import DCOSStore from "#SRC/js/stores/DCOSStore";
import FullScreenModal from "#SRC/js/components/modals/FullScreenModal";
import RequestErrorMsg from "#SRC/js/components/RequestErrorMsg";
import Page from "#SRC/js/components/Page";

class EditServiceModal extends Component {
  render() {
    const { id = "/" } = this.props.params;
    const serviceID = decodeURIComponent(id);
    const serviceLoaded = DCOSStore.serviceDataReceived;
    const service = DCOSStore.serviceTree.findItemById(serviceID);

    // Loading, showing an empty modal instead
    if (!serviceLoaded) {
      return <FullScreenModal open={true} />;
    }

    // Service not found
    if (!service) {
      return (
        <Page>
          <Page.Header />
          <RequestErrorMsg
            header={<p>This service does not exist, you can not edit it</p>}
          />
        </Page>
      );
    }

    if (
      service.getLabels().DCOS_PACKAGE_DEFINITION != null ||
      service.getLabels().DCOS_PACKAGE_METADATA != null
    ) {
      return <EditFrameworkConfiguration {...this.props} />;
    }

    return <CreateServiceModal {...this.props} />;
  }
}

export default EditServiceModal;
