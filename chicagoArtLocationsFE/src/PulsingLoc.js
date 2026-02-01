import React, { useState } from 'react';
import './pulseCircle.css';
import { motion } from 'framer-motion';
import { useSearchResultsContext } from './SearchResultsProvider';

const PulsatingCircle = ({ width }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLocation } = useSearchResultsContext();
  const directionalCoords = currentLocation
    ? {
        latitiude:
          Math.abs(currentLocation.latitude).toFixed(2) +
          (currentLocation.latitude > 0 ? `°N` : `°S`),
        longitude:
          Math.abs(currentLocation.longitude).toFixed(2) +
          (currentLocation.longitude > 0 ? `°W` : `°E`),
      }
    : { latitude: '0', longitude: '0' };
  return (
    <motion.div
      layout
      data-isopen={isOpen}
      initial={{ borderRadius: 50 }}
      className="box"
      onHoverEnd={() => setIsOpen(false)}
      onHoverStart={() => {
        setIsOpen(true);
      }}
    >
      <motion.div layout data-isopen={isOpen} className="circle" />
      <motion.div layout data-isopen={isOpen} className="borderCir" />
      <motion.div layout data-isopen={isOpen} className="borderCir2" />

      <motion.div layout data-isopen={isOpen} className="location">
        <i>
          {directionalCoords.latitiude}&ensp;&ensp;{directionalCoords.longitude}
        </i>
      </motion.div>
    </motion.div>
  );
};

export default PulsatingCircle;

/** left: isExpanded?width/2-200+"px":"1.65%",  
 *     {false && (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        key="overlay"
        className="overlay"
        />
    )}

    37°45'15.0"N&ensp;&ensp;122°25'08.8"W
*/
