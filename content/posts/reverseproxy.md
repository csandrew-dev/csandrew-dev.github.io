---
title: "Setting Up a Reverse Proxy For MDM (and other services)"
date: 2025-08-06T23:51:46-04:00
draft: true
tags: [macos, mdm, npm, docker-compose, homelab, open source, selfhosting]
author: "me"
showToc: false
TocOpen: false
hidemeta: false
comments: false
description: "Watch me set up a reverse proxy for my homelab"
canonicalURL: ""
disableHLJS: false
disableShare: false
hideSummary: false
searchHidden: false
ShowReadingTime: false
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowWordCount: true
ShowRssButtonInSectionTermList: true
UseHugoToc: true
cover:
    image: ""
    alt: ""
    caption: ""
    relative: false
    hidden: false
editPost:
    URL: ""
    Text: "Suggest Changes"
    appendFilePath: true
---

## Overview and Goal
I want to set up a reverse proxy to serve my LAN for 3 main reasons:
1. Get proper TLS/SSL certificates so I can go to my selfhosted services without any warning from my browser
2. Use a proper domain so I feel like a real sysadmin and I can remember those better than IP addresses (yes I know I can do local hostname and domain, see point 1)
3. I need proper certificates for running open source MDMs @ home for a longer term than the 2 hour ngrok tunnels that are used in the nano quickstart.

### Environment
Couple of things to note about my environment.
- I used [Ubiquiti Unifi](https://www.ui.com/) gear so DNS and DCHP are handled by my Unifi Gateway Ultra.
- Nothing is getting exposed to the external web.
![](../../reverseproxy/ichooselife.jpg#center)

- My domain is with [Cloudflare](https://www.cloudflare.com/) and we use Cloudflare's api token to get certificates from [Let's Encrypt](https://letsencrypt.org/).
- Reverse proxy is [Nginx](https://nginx.org/en/) using the [Nginx Proxy Manager project](https://nginxproxymanager.com/).

I set my reverse proxy up on an Intel Nuc I have running 24/7 cause it is also a [TailScale exit node](https://tailscale.com/kb/1103/exit-nodes) for so I can access my services remotely but a VM on something should work just the same.

### Simplified Process of How It Will All Work
