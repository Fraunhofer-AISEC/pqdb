/*
 * SearchDialogContext — lets any routed view open the global CommandPalette
 * dialog that is rendered once at the App shell level.
 *
 * The palette (and the AppBar search button) are owned by App.jsx. A view like
 * the landing page needs a way to trigger that same dialog without duplicating
 * the search logic or reaching through the router. This tiny context exposes an
 * `openSearch()` callback wired to the same `searchOpen` state that drives
 * CommandPalette, so search behaves identically everywhere.
 */

import PropTypes from 'prop-types';
import { createContext, useContext } from 'react';

const SearchDialogContext = createContext({ openSearch: () => {} });

function SearchDialogProvider({ openSearch, children }) {
  return (
    <SearchDialogContext.Provider value={{ openSearch }}>
      {children}
    </SearchDialogContext.Provider>
  );
}

function useSearchDialog() {
  return useContext(SearchDialogContext);
}

SearchDialogProvider.propTypes = {
  openSearch: PropTypes.func.isRequired,
  children: PropTypes.node,
};

SearchDialogProvider.defaultProps = {
  children: undefined,
};

export { SearchDialogProvider, useSearchDialog };
export default SearchDialogProvider;
