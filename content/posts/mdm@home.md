---
title: "NanoMDM @ home"
date: 2025-08-09T20:49:00-04:00
draft: false
tags: [macos, nanoMDM, MicroMDM, Open Source, MDM, homelab]
author: "me"
showToc: true
TocOpen: true
hidemeta: false
comments: false
description: ""
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

Documents referenced:

- [https://github.com/micromdm/nanomdm/blob/main/docs/quickstart.md](https://github.com/micromdm/nanomdm/blob/main/docs/quickstart.md)
- [https://github.com/micromdm/micromdm/blob/main/docs/user-guide/quickstart.md#configure-an-apns-certificate](https://github.com/micromdm/micromdm/blob/main/docs/user-guide/quickstart.md#configure-an-apns-certificate)

## Here is what I did to get NanoMDM up and running in my homelab!

### Certificate Hell!

1. Download `mdmctl` from [https://github.com/micromdm/micromdm/releases](https://github.com/micromdm/micromdm/releases)
2. Move `mdmctl` binary into Path. I chose `/usr/bin/local/` (Gatekeeper warning incoming) (on your local machine fyi, `mdmctl` not needed on the server.)
3. Actual need to start [here](https://github.com/micromdm/micromdm/blob/main/docs/user-guide/quickstart.md#configure-mdmctl), NanoMDM's quickstart needs updating. I will be making a PR soon™.
4. Configure `mdmctl` with:
```zsh
mdmctl config set \
  -name production \
  -api-token MySecretAPIKey \
  -server-url https://my-server-url
```
So I did:
```zsh
mdmctl config set -name production -api-token {Secure API token} -server-url https://nano.openedmac.com
```

```zsh
mdmctl config switch -name production
```

![](../../mdm@home/mdmctl-config.png#center)

I believe, you can actually just put whatever you want in for the `name`, `api-token` and `server-url` because `mdmctl` forces you to have a config set before using it, but since we are using NanoMDM we won't be using `mdmctl` for anything but generating CSRs and signing. I didn't realize that till after the fact (I also may be wrong in that assumption).

5. Generate MDM Vendor CSR:
```zsh
mdmctl mdmcert vendor -password=secret -country=US -email=admin@acme.co
```
So I did:
```zsh
mdmctl mdmcert vendor -password={Secure Pasword} -country=US -email=nano@openedmac.com
```

![](../../mdm@home/mdmctl-vendor-csr.png#center)

Straight from MicroMDM's Quickstart.md:
> Log in to the Apple Developer Portal (https://developer.apple.com/account), and navigate to the Certificates, IDs & Profiles section (https://developer.apple.com/account/resources/certificates/list).
>
>    Click the plus symbol (+) next to Certificates
>    Select MDM CSR under the Services section, click Continue
>    Upload the VendorCertificateRequest.csr file, click Continue
>    Click Download to download the certificate.
>    Move the downloaded certificate file (likely called mdm.cer) to the mdm-certificates folder.
>
> You now have the vendor side of the certificate flow complete, and you need to complete the customer side of this flow, with the help of the vendor cert.

![](../../mdm@home/developer-portal.png#center)

Now our `mdm-certificates` directory looks like this:
![](../../mdm@home/mdm-certificates-folder1.png#center)

6. Create the APNS CSR.
```zsh
mdmctl mdmcert push -password=secret -country=US -email=admin@acme.co
```
I believe password is supposed to be different from the Vendor CSR encryption password. So I did:
```zsh
mdmctl mdmcert push -password={Another Secure Password} -country=US -email=nano@openedmac.com
```

![](../../mdm@home/mdmctl-apns-csr.png#center)

7. Sign the APNS CSR with our Vendor Certificate.
```zsh
mdmctl mdmcert vendor -sign -cert=./mdm-certificates/mdm.cer -password=secret
```
So this password is the Vendor CSR's password from step 5. So mine was:
```zsh
mdmctl mdmcert vendor -sign -cert=./mdm-certificates/mdm.cer -password={Secure Password}
```

![](../../mdm@home/mdmctl-sign-apns-csr-with-vendor-cert.png#center)

This creates the `PushCertificateRequest.plist` that we send to Apple.

8. Get APNS Certificate

From MicroMDM's Quickstart.md again:
> Sign in to [identity.apple.com](https://identity.apple.com/pushcert/) and upload the `PushCertificateRequest.plist` file to get the APNS certificate. The site offers a notes field, it's a good idea to use it to mark which server you're obtaining a certificate for, as you will come back for renewals.
>
> If you're getting certificates for multiple environments (staging, production) or running multiple in house MDM instances, you MUST sign a separate push request for each one. Using the same vendor certificate is okay, but using the same push certificate is not.
>
> If you've uploaded the plist, you will be offered a certificate, which is signed for the `mdm-certificates/PushCertificatePrivateKey.key` key. Copy the certificate to the same directory.

![](../../mdm@home/identity-portal.png#center)

9. Now we have a `MDM_{Developer account name}_Certificate.pem` certificate. We can jump back to the NanoMDM specific quickstart guide now, thanks Micro!

### SCEP time!
10. ssh into your nano's server, lets start a SCEP server.
11. Download the micromdm SCEP project from [https://github.com/micromdm/scep/releases](https://github.com/micromdm/scep/releases)
```bash
mkdir SCEP && cd SCEP
```
```zsh
curl -RLO https://github.com/micromdm/scep/releases/download/{version}/{platform&architecture}
```
```zsh
unzip {scep.zip}
```

12. Init SCEP CA certificate
```zsh
./scepserver-linux-amd64 ca -init
```
This creates the `depot/` directory and creates a `ca.pem` file.

13. Start SCEP server
```zsh
./scepserver-linux-amd64 -allowrenew 0 -challenge nanomdm -debug
```

![](../../mdm@home/scep-server-setup.png#center)

14. Since I have a reverse proxy running in my homelab, I do not use ngrok as the nanomdm quickstart guide starts to go into. Instead I have created local DNS records and Reverse Proxy records so [scep.openedmac.com]() goes to my SCEP server on port 8080. Check NanoMDM's quickstart.md for how to work with ngrok.

15. Get SCEP CA Certificate for NanoMDM
```zsh
curl 'https://{ngrok domain}/scep?operation=GetCACert' | openssl x509 -inform DER > ca.pem
```
or for me
```zsh
curl 'https://scep.openedmac.com/scep?operation=GetCACert' | openssl x509 -inform DER > ca.pem
```

![](../../mdm@home/get-scep-ca-cert.png#center)

You want to get the `ca.pem` file on the NanoMDM server. This step is not really neccessary for me since the SCEP and NanoMDM servers are the same machine, but it is also a test to see if the SCEP server is working.

### NanoMDM time!
16. Download the nanoMDM project from [https://github.com/micromdm/nanomdm/releases](https://github.com/micromdm/nanomdm/releases)
```zsh
mkdir NANO && cd NANO
```
```zsh
curl -RLO https://github.com/micromdm/nanomdm/releases/download/{version}/{platform&architecture}
```
```zsh
unzip {nanomdm.zip}
```

17. Run the nanoMDM server
```zsh
./nanomdm-linux-amd64 -ca ../../ca.pem -api nanomdm -debug`
```
> `../../ca.pem` is the relative path to the ca certificate we got from the SCEP server.
>
> "By default the file storage backend will write enrollment data into a directory called db." - NanoMDM quickstart. I believe this has changed. I think it is `dbkv` now.
>
> Note: API keys are simple HTTP Basic Authorization passwords with a username of "nanomdm". This means that any proxies, like ngrok, will have access to API authentication.

![](../../mdm@home/nano-server-run.png#center)

18. Again, I have the proxy so I don't use ngrok as the quickstart guide does so I have made another local DNS record and Proxy for the nanoMDM server to run on port 9000 on [nano.openedmac.com](). Check quickstart for ngrok instructions (there is some funky stuff you have to do to run 2 ngrok tunnels at once on a free tier).

19. Upload the push cert via nanoMDM API

**note: I'm back on my local machine, the server is pretty much setup.
```zsh
cat /path/to/push.pem /path/to/push.key | curl -T - -u nanomdm:nanomdm 'http://127.0.0.1:9000/v1/pushcert'
```
for ngrok/same machine testing.

For me I did:
```zsh
cat ./mdm-certificates/MDM_Openedmac_Certificate.pem ./mdm-certificates/PushCertificatePrivateKey.key | curl -T - -u nanomdm:nanomdm 'https://nano.openedmac.com/v1/pushcert'   
```

And got:
```json
{
	"error": "private key PEM appears to be encrypted",
	"not_after": "0001-01-01T00:00:00Z"
}
```
Which I believe is because the documentation is a bit messed up, so I will submit a PR to get that fixed.

To fix it now,
```zsh
openssl rsa -in ./mdm-certificates/PushCertificatePrivateKey.key -out ./mdm-certificates/PushCertificatePrivateKey.pem
```
at the prompt, put in the APNS CSR password from step 6.

I found this fix in [https://github.com/micromdm/nanomdm/issues/106](https://github.com/micromdm/nanomdm/issues/106).

![](../../mdm@home/encrypted-cert-fix.png#center)

So redoing that
```zsh
cat ./mdm-certificates/MDM_Openedmac_Certificate.pem ./mdm-certificates/PushCertificatePrivateKey.pem | curl -T - -u nanomdm:nanomdm 'https://nano.openedmac.com/v1/pushcert'
```

![](../../mdm@home/uploaded-apns-cert.png#center)
![](../../mdm@home/uploaded-apns-cert-backend.png#center)

You want to note the Topic you get. It is very important in the MDM protocol.

### Configure the Enrollment Profile

20. Download the example/starter plist file from the NanoMDM project: [https://github.com/micromdm/nanomdm/blob/main/docs/enroll.mobileconfig](https://github.com/micromdm/nanomdm/blob/main/docs/enroll.mobileconfig)

You have to make edits to this fyi.

a. Under Challenge, change `SCEP-CHALLENGE-HERE` -> `nanomdm` (We configured this in step 13).

b. Under URL, change `https://mdm.example.org/scep` -> `https://yourdomain.orngrok/scep`, mine was `https://scep.openedmac.com/scep`

c. Under ServerURL, change `https://mdm.example.org/mdm` -> `https://yourdomain.orngrok/mdm`, mine was `https://nano.openedmac.com/mdm`

d. Under Topic, change `com.apple.mgmt.External.YOUR-PUSH-TOPIC-HERE` -> the one you got in step 19.

21. Install the profile!

**note: you can sign it if you want, doesn't make much difference. I signed mine with Hancock [https://github.com/JeremyAgost/Hancock](https://github.com/JeremyAgost/Hancock)

Double click on the .mobilecofig

Go to System Settings > Device Management, Accept the profile

Check out the SCEP and NanoMDM server logs:
![](../../mdm@home/enrollment-logs.png#center)

Make a note of your device id in the log, where I highlighted.

22. Run a check-in to test it out!
```zsh
curl -u nanomdm: nanomdm 'https://nano.openedmac.com/v1/push/{Device ID}'
```
![](../../mdm@home/successful-checkin.png#center)

If you get an error, check your certificates and ngrok tunnel.

23. Use cmdr.py to run some more tests. (cmdr.py is in the nano.zip)
```zsh
./cmdr.py -r | curl -T - -u nanomdm:nanomdm 'https://{mdm_server_url}/v1/enqueue/{Device ID}'
```
Should give you a response similar to this:
```json
{
	"status": {
		"{Device ID}": {
			"push_result": "3F93EB05-1A2E-5C8E-B094-787700129D3F"
		}
	},
	"command_uuid": "dc56ac5e-462a-4b39-9639-29e4b725551a",
	"request_type": "ProvisioningProfileList"
}
```

`./cmdr.py -r` will queue a random (read-only) mdm command so you can make sure the whole setup is working. Run `./cmdr.py` for a bit more explaination/options.

After all that we have mdm @home. Time to mess around for real!