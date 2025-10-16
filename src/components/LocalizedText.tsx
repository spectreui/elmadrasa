import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';

interface LocalizedTextProps extends TextProps {
  tx?: string;
  children?: string;
}

export const LocalizedText = ({ tx, children, style, ...props }: LocalizedTextProps) => {
  const { t, isRTL } = useTranslation();
  
  const text = tx ? t(tx) : children || '';
  
  return (
    <Text
      style={[
        style,
        isRTL && { textAlign: 'right' }
      ]}
      {...props}
    >
      {text}
    </Text>
  );
};
