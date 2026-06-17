import React from "react";
import useScreen from "@/hooks/useScreen";

export default function withEnhancers(WrappedComponent) {
  return function HookInjector(props) {
    const screen = useScreen();

    return (
      <WrappedComponent
        {...props}
        hooks={{
          screen,
        }}
      />
    );
  };
}
