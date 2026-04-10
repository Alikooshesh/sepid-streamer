// Chrome Extension Background Script
chrome.action.onClicked.addListener((tab) => {
  // Open the side panel when the extension icon is clicked
  chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: 'https://next-video-player.web.app',
    enabled: true
  });
  chrome.sidePanel.open({ tabId: tab.id });
});

// Optional: Open in a new tab if sidePanel is not preferred
/*
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'https://next-video-player.web.app' });
});
*/
