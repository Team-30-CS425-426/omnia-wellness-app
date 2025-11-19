import { View, ViewProps, ViewStyle } from 'react-native'
import React from 'react'

interface SpacerProps extends ViewProps{
    width?: string | number;
    height?: string | number;
}
const Spacer = ({ width = "100%", height = 40, ...restProps } : SpacerProps) => {
    const internalStyle: ViewStyle = {
        width: width,
        height: height
    } as ViewStyle;
    return (
    <View style = {internalStyle} {...restProps} />
  );
};

export default Spacer