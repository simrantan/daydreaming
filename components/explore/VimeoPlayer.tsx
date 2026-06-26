import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

function buildEmbedHtml(vimeoId: string): string {
  const src = `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&controls=0&background=1&dnt=1`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    src="${src}"
    frameborder="0"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
  ></iframe>
</body>
</html>`;
}

type Props = {
  url: string;
  isActive: boolean;
  style?: object;
};

export function VimeoPlayer({ url, style }: Props) {
  const vimeoId = extractVimeoId(url);
  if (!vimeoId) return null;

  return (
    <WebView
      style={[styles.webView, style]}
      source={{ html: buildEmbedHtml(vimeoId) }}
      allowsInlineMediaPlayback
      allowsFullscreenVideo={false}
      mediaPlaybackRequiresUserAction={false}
      scrollEnabled={false}
      bounces={false}
      originWhitelist={['*']}
      javaScriptEnabled
      mixedContentMode="always"
    />
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
});
