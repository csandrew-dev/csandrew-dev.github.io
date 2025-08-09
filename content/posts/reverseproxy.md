---
title: "Setting Up a Reverse Proxy For MDM (and other services)"
date: 2025-08-06T23:51:46-04:00
draft: true
tags: [macos, mdm, npm, docker-compose, homelab, open source, selfhosting]
author: "me"
showToc: true
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
ShowWordCount: false
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
2. Use a proper domain so I feel like a real sysadmin and I can remember those better than IP addresses (yes, I know I can do local hostname and domain, see point 1)
3. I need proper certificates for running open source MDMs @ home for a longer term than the 2 hour ngrok tunnels that are used in the nano quickstart.

### Environment
Couple of things to note about my environment.
- I use [Ubiquiti Unifi](https://www.ui.com/) gear so DNS and DCHP are handled by my Unifi Gateway Ultra.
- Nothing is getting exposed to the external web.
![](../../reverseproxy/ichooselife.jpg#center)

- My domain is with [Cloudflare](https://www.cloudflare.com/) and we use Cloudflare's api token to get certificates from [Let's Encrypt](https://letsencrypt.org/).
- Reverse proxy is [Nginx](https://nginx.org/en/) using the [Nginx Proxy Manager project](https://nginxproxymanager.com/).

I set my reverse proxy up on an Intel NUC I have running 24/7 cause it is also a [Tailscale exit node](https://tailscale.com/kb/1103/exit-nodes) for so I can access my services remotely but a VM on something should work just the same.

### Simplified Process of How It Will All Work
![](../../reverseproxy/reverseproxy-overview.png#center)

## How I did it. YMMV.

1. Install docker-compose on your proxy server

> I have SSH setup (if you don't, do that first). So connect and run the installation commands on Docker's website: [https://docs.docker.com/desktop/setup/install/linux/](https://docs.docker.com/desktop/setup/install/linux/). Yes, I know compose is for running multiple containers and technically you can just run Nginx Proxy Manager (referred to as NPM from now on) with docker, but you can run the database container as well (I don't bother). Also compose is cooler and I like it more.

2. Create a directory for the compose file like `reverse-proxy` or `npm`.

        mkdir reverse-proxy

3. Create your `docker-compose.yml` and paste in:
```yml
version: "3.9"

services:
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt
    restart: unless-stopped

volumes:
  npm_data:
  npm_letsencrypt:
```

4. Start 'er up!

        docker compose up -d

> Check out more info about the NPM project here: [https://nginxproxymanager.com/guide/](https://nginxproxymanager.com/guide/)

5. Go to the web UI, at [http://proxy.yourlocal.domain:81]() or by ip (configure static IPs, hostnames, and DNS records!)

In my case it was [http://nuc.local.lan:81/login]()

![](../../reverseproxy/npm-login.png#center)

> Default creds are admin@example.com and changeme so change those when you are in.


6. You want to go to 'SSL Certificates' > 'Add SSL Certificate' > 'Let's Encrypt'.

    a. In 'Domain Names', put `*.yourdomain.com` so you can just use the same certificate for all your services. This is called a wildcard certificate.

    b. Put an email in

7. Check the 'Use DNS Challenge' (read more about DNS challenges here: [https://letsencrypt.org/docs/challenge-types/](https://letsencrypt.org/docs/challenge-types/)). 
    
    a. Choose your DNS provider (probably your domain registar as well). Mine is Cloudflare so I chose that and all I have to do is log into Cloudflare and generate an API token.

    In Cloudflare's dash search for 'API token', click the first result. Make a new custom API token. Name it 'NPM API token'. Permissions: Zone, DNS, Edit. Zone Resources: Include, Specified zone, yourdomain.com. Save that. You should get a pop up that shows the API token and a `curl` command to test it. Copy all of that.
 
8. Agree to the TOS

![](../../reverseproxy/npm-ssl-cert.png#center)

Now you have an SSL Certificate to use!

The flow now for every service you want to setup is 

1. Create a local DNS record in your router or unifi dash that has the `service.yourdomain.com` -> `proxy.local.domain` or the NPM server's IP 

(Your choice on A records or CNAME records. I like to have 1 A record for the `host.local.domain` -> server static IP, then everything else is pointed to that with a CNAME record incase I ever need to change the server's IP, I only change it in one location.)

2. In NPM > 'Hosts' > 'Proxy Hosts', create a host with the domain name as `service.yourdomain.com` -> `service.local.domain` + port  or IP + port and apply the SSL certificate.

![](../../reverseproxy/npm-proxy-host.png#center)

Some things to note:
- some services might require websockets so if `service.yourdomain.com` doesn't work the first time mess with the NPM Proxy Host settings.
- when testing, clear your DNS cache on your machine often so your machine and browser don't make you think nothing is working after making changes.


## Summary
Now enjoy some encrypted comms!

Hope this was a good enough guide to get you started on setting this up in your homelab.