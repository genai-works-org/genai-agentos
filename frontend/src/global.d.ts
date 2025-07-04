declare module '*.module.css' {
  const classes: CSSModuleClasses;
  export default classes;
}

declare module '*.svg' {
  import * as React from 'react';
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
