import mixin from 'reactjs-mixin';
import {Link} from 'react-router';
/* eslint-disable no-unused-vars */
import React from 'react';
/* eslint-enable no-unused-vars */
import {StoreMixin} from 'mesosphere-shared-reactjs';

import AddRepositoryFormModal from '../../components/modals/AddRepositoryFormModal';
import CosmosPackagesStore from '../../stores/CosmosPackagesStore';
import FilterBar from '../../components/FilterBar';
import FilterInputText from '../../components/FilterInputText';
import Loader from '../../components/Loader';
import Page from '../../components/Page';
import RepositoriesTable from '../../components/RepositoriesTable';
import RequestErrorMsg from '../../components/RequestErrorMsg';

const RepositoriesBreadcrumbs = (addButton) => {
  const crumbs = [
    <Link to="settings/repositories" key={-1}>Respositories</Link>
  ];

  return <Page.Header.Breadcrumbs iconID="gear" breadcrumbs={crumbs} addButton={addButton} />;
};

const METHODS_TO_BIND = [
  'handleSearchStringChange',
  'handleCloseAddRepository',
  'handleOpenAddRepository'
];

class RepositoriesTab extends mixin(StoreMixin) {
  constructor() {
    super();

    this.state = {
      addRepositoryModalOpen: false,
      hasError: false,
      isLoading: true,
      searchString: ''
    };

    this.store_listeners = [
      {
        name: 'cosmosPackages',
        events: ['repositoriesSuccess', 'repositoriesError'],
        suppressUpdate: true
      }
    ];

    METHODS_TO_BIND.forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }

  componentDidMount() {
    super.componentDidMount(...arguments);
    CosmosPackagesStore.fetchRepositories();
  }

  handleCloseAddRepository() {
    this.setState({addRepositoryModalOpen: false});
  }

  handleOpenAddRepository() {
    this.setState({addRepositoryModalOpen: true});
  }

  onCosmosPackagesStoreRepositoriesError() {
    this.setState({hasError: true});
  }

  onCosmosPackagesStoreRepositoriesSuccess() {
    this.setState({hasError: false, isLoading: false});
  }

  handleSearchStringChange(searchString = '') {
    this.setState({searchString});
  }

  getErrorScreen() {
    return <RequestErrorMsg />;
  }

  getLoadingScreen() {
    return <Loader />;
  }

  render() {
    let {
      addRepositoryModalOpen,
      hasError,
      isLoading,
      searchString
    } = this.state;

    let content = null;

    if (hasError) {
      content = this.getErrorScreen();
    } else if (isLoading) {
      content = this.getLoadingScreen();
    } else {
      let repositories = CosmosPackagesStore.getRepositories()
        .filterItemsByText(searchString);

      content = (
        <div>
          <FilterBar rightAlignLastNChildren={1}>
            <FilterInputText
              className="flush-bottom"
              placeholder="Search"
              searchString={searchString}
              handleFilterChange={this.handleSearchStringChange} />
          </FilterBar>
          <RepositoriesTable repositories={repositories} filter={searchString} />
          <AddRepositoryFormModal
            numberOfRepositories={repositories.getItems().length}
            open={addRepositoryModalOpen}
            onClose={this.handleCloseAddRepository} />
        </div>
      );
    }

    return (
      <Page>
        <Page.Header
          addButton={{onItemSelect: this.handleOpenAddRepository, label: 'Add Repository'}}
          breadcrumbs={<RepositoriesBreadcrumbs />} />
        {content}
      </Page>
    );
  }
}

RepositoriesTab.routeConfig = {
  label: 'Repositories',
  matches: /^\/settings\/repositories/
};

module.exports = RepositoriesTab;
