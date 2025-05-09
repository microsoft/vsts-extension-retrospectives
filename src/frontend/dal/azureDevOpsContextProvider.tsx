import * as SDK from 'azure-devops-extension-sdk';
import React from 'react';

type SDKContextProps = {
  SDK: typeof SDK;
};

export const SDKContext = React.createContext<SDKContextProps>({} as SDKContextProps);

export const SDKProvider: React.FC = (props) => {
  const context: SDKContextProps = {
    SDK
  };

  const initSDK = async () => {
    await SDK.init();
  };

  React.useEffect(() => {
    initSDK();
  }, []);

  return (
    <SDKContext.Provider value={context}>{props.children}</SDKContext.Provider>
  );
};
