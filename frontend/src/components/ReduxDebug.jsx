import React from 'react';
import { useSelector } from 'react-redux';

function ReduxDebug() {
  const state = useSelector(state => state);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h3>Redux State Debug</h3>
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        overflow: 'auto',
        maxHeight: '400px',
        fontSize: '12px'
      }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}

export default ReduxDebug;
