import './App.css';
import { useWindowDimContext } from './WindowDimInfoProvider';
import Pulsating from './PulsingLoc.js';
import SearchBar from './SearchBar.js';
import SearchResults from './SearchResults.js';
import Map from './Map';

function App() {
  const { windowWidth } = useWindowDimContext();

  return (
    <>
      <Map />
      <Pulsating width={windowWidth} />
      <SearchBar />
      <div style={{ height: '300px' }} /> {/** spacer */}
      <SearchResults />
    </>
  );
}

export default App;
