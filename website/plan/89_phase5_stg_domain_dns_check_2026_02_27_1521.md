# Faz 5 STG Domain DNS Check Report

Tarih: 2026-02-27 15:21:33
Durum: FAIL

| Check | Status | Detail |
| --- | --- | --- |
| vercel domains inspect stg-app.neredeservis.app | FAIL | stg dns not configured |
| required dns record | INFO | A stg-app.neredeservis.app 76.76.21.21 (DNS only) |

## Raw Output (first 60 lines)
- Fetching Domain stg-app.neredeservis.app under infonetoapp-clouds-projects
- > Domain stg-app.neredeservis.app found under infonetoapp-clouds-projects [3s]
- 
-   General
- 
-     Name			neredeservis.app
-     Registrar			Third Party
-     Expiration Date		-
-     Creator			infonetoapp-cloud
-     Created At			25 February 2026 02:41:09 [3d ago]
-     Edge Network		yes
-     Renewal Price		-
- 
-   Nameservers
- 
-     Intended Nameservers    Current Nameservers            
-     ns1.vercel-dns.com      diva.ns.cloudflare.com    ?    
-     ns2.vercel-dns.com      remy.ns.cloudflare.com    ?    
- 
- WARN! This Domain is not configured properly. To configure it you should either:
-   a) Set the following record on your DNS provider to continue: `A stg-app.neredeservis.app 76.76.21.21` [recommended]
-   b) Change your Domains's nameservers to the intended set detailed above.
- 
-   We will run a verification for you and you will receive an email upon completion.
-   Read more: https://vercel.link/domain-configuration
- 
