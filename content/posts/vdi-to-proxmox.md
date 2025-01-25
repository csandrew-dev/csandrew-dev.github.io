---
title: "Using a VirtualBox VDI Image in a Proxmox VM"
date: 2025-01-24T20:59:56-05:00
draft: false
tags: ["proxmox", "virtual machine", "qemu", "vdi", "tailscale", "remote"]
author: "me"
showToc: true
TocOpen: false
hidemeta: false
comments: false
description: "Quick guide to using a VirtualBox VDI image in a Promox VM plus a dash of Tailscale networkwizardy."
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
    URL: "https://github.com/csandrew-dev/csandrew-dev.github.io/blob/main/content/posts/vdi-to-proxmox.md"
    Text: "Suggest Changes"
    appendFilePath: true
---

## My Goal
I wanted to use a VDI image from [SEED Labs](https://seedsecuritylabs.org/) in my [Proxmox](https://www.proxmox.com/en/) instance since I already had that running and would much rather have it running on that than my desktop machine. I also wanted to be able to access both [Proxmox](https://www.proxmox.com/en/) and the VM remotely when I'm not at home. I already have [Tailscale](https://tailscale.com) set up on my home network with exit nodes and subnet routers so I won't go over that with detail but I did have to enable [spilt dns](https://tailscale.com/learn/why-split-dns) to have hostnames resolve.

## Setting Up the VM
### Getting the File
The first you need to do is get the VDI image on the Proxmox host. You can do this many ways but since my VDI is available from the SEED Lab website for download, I ssh'd into the Proxmox machine and downloaded the file with wget:

`wget {url of download}`

For me that was:

![](../../vdi-to-proxmox/wget.png#center)
(yes I know "don't do things as root", oh well, just this once 😉)

### Initial VM Settings
On the Proxmox UI:
1. click "Create VM". ![](../../vdi-to-proxmox/createVM.png#center)

2. select "Do not use any media" under OS. ![](../../vdi-to-proxmox/noMedia.png#center)

3. leave defaults under System.

4. under Disks, select your volume on Proxmox and disk size. ![](../../vdi-to-proxmox/initDrive.png#center)

5. set your CPU and core count. Note: I had to set my type to "qemu64". ![](../../vdi-to-proxmox/initCPU.png#center)

6. set your memory amount for the VM.
![](../../vdi-to-proxmox/initMem.png#center)

7. set your network device if necessary.

8. confirm your VM settings. Note your vmid value here, mine is 101. ![](../../vdi-to-proxmox/confirm.png#center)

### Detach that Disk
On the Proxmox UI:
1. select your VM in the "Datacenter" side bar.

2. select "Hardware" 

3. select "Hard Disk"

4. click "Detach" and confirm it.

![](../../vdi-to-proxmox/detach.png#center)

5. click "Remove" and confirm it.

![](../../vdi-to-proxmox/remove.png#center)

### Manually Add Your Image
We're going to use [`qm`](https://pve.proxmox.com/pve-docs/qm.1.html) to set the disk to our VDI image. So in the shell for the Proxmox host:

```qm importdisk {vmid} /path/to.vdi {proxmox-volume}```

so for my example I did:

`qm importdisk 101 /SEED.vdi VMdata`

![](../../vdi-to-proxmox/command.png#center)

This will take a minute depending on the size of the VDI file.

### Load and Boot
Back on the web UI:
1. under your VM, under "Hardware" select your new **unused** disk (the vdi we just imported).

2. set it to SATA.

![](../../vdi-to-proxmox/newDrive.png#center)

3. click "Add".

4. go from "Hardware" to "Options".

5. click on "Boot Order".

6. enable your disk and drag it to the top of the order.

![](../../vdi-to-proxmox/bootOrd.png#center)

7. click "OK".

8. start the VM. You should see the Task log in the bottom view with a "OK" status or you can access the console to check.

![](../../vdi-to-proxmox/vmBoot.png#center)

## Tailscale Access
I have an  Apple TV on my LAN acting as a Tailscale [Exit Node](https://tailscale.com/kb/1103/exit-nodes) and [Subnet Router](https://tailscale.com/kb/1019/subnets). Just follow their documentation and guides for that. I will show what I had to do to be able to access the Proxmox web UI through my tailnet. 

### The behavior I wanted
I want to connect to my Tailnet on my laptop, type in the address bar "http://proxmox.local.lan:8006" and get the web UI, as I do at home. Later I plan to do reverse proxy things to be able to leave out the port number.

### Spilt DNS
In Tailscale there is a feature for this called "[Spilt DNS](https://tailscale.com/learn/why-split-dns)". 

To enable it:
1. go to the DNS tab in the Tailscale Admin Console.
2. under "Nameservers", click "Add Nameserver".
3. for the IP, this is your local DNS IP, most likely your router, i.e., 192.168.1.1 or the like.
4. toggle the "Restrict to domain" to ON for Spilt DNS.
5. for the domain, this is your LAN's domain, most routers lets you set this, mine in local.lan

![](../../vdi-to-proxmox/tailscaleDNS.png#center)

## Conclusion
This was a cool introduction to using Proxmox and also having services available when I'm out and about. I hope I made my steps clear and it works for you as well. 

## Sources
I'm not a Proxmox expert or QEMU god so lots of the same steps can be followed from the legend, David Yin at https://www.yinfor.com/2019/03/another-way-to-move-virtualbox-vdi-to-proxmox-ve.html
