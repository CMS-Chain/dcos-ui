/**
 * This class maintains a dictionary with all the currently available
 */
class DSLFilters {

  /**
   * DSLFilters constructor with optional initial filters array
   *
   * @param {Array} [filters] - An array with the initial filters
   */
  constructor(filters=[]) {
    this.filters = filters;
  }

  /**
   * Plug a filter to the list of filters
   *
   * @param {DSLFilter} filter - The filter to plug
   * @returns {DSLFilters} Returns a DSLFilters object for chaining the calls
   */
  plug(filter) {
    this.filters.push(filter);
    return this;
  }

  /**
   * Returns an array of filter objects that match the specified filter token
   * array and arguments.
   *
   * @param {Number} filterType - The filter type (attribute, fuzzy, freetext)
   * @param {Object} filterArguments - The filter arguments, with `text` containing the string the user provided
   * @returns {Array} Returns an array of DSLFilter objects that can handle the given token
   */
  getMatchingFilters(filterType, filterArguments) {
    return this.filters.filter(function (filter) {
      return filter.filterCanHandle(filterType, filterArguments);
    });
  }

};

module.exports = DSLFilters;
