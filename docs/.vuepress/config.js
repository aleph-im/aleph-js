module.exports = {
  title: 'Aleph-JS',
  description: 'Aleph.im Javascript API',
  themeConfig: {
    logo: '/logo.svg',
    repo: 'aleph-im/aleph-js',
    editLinks: true,
    docsDir: 'docs',
    editLinkText: 'Help us improve this page!',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
			{ text: 'Dev resources', link: 'https://aleph.im/#/developers' }
    ],
    sidebar: [
      {
        title: 'Guide',   // required
        collapsable: false, // optional, defaults to true
        sidebarDepth: 1,    // optional, defaults to 1
        children: [
          ['/guide/', 'Introduction'],
          ['/guide/getting-started', 'Getting Started']
        ]
      }
		]
  }
}
  