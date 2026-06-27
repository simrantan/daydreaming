import React from 'react';
import { Pressable, Linking, StyleProp, ViewStyle } from 'react-native';

type Props = {
  href: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function ExternalLink({ href, style, children }: Props) {
  return (
    <Pressable style={style} onPress={() => Linking.openURL(href)}>
      {children}
    </Pressable>
  );
}
