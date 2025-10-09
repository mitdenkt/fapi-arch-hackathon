import autocannon from "autocannon";

const connections = 5
const bookingLimit = 200

const result = await autocannon({
    url: `https://haubertoh.fapi1.mitdenkt.xyz/api/v2/backend/bookings?lastModifiedGe=2025-08-01T23%3A00%3A00.000Z&deleted=true&noBookingNumber=true&cancelled=true&limit=${bookingLimit}`,
    headers: {
        "Dpop": 'eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6IkVDIiwieCI6InJoN3NvYVdlVk10R2dGRFBPdmV3TGlSdFVubXQ1RFRMdUxfQUY4OWpDNXMiLCJ5IjoidGRENEI2WjlnU0pzaE55ZW03bW5TcHhDY1pXc01PVWNuZ2pYRWtCbnZXZyIsImNydiI6IlAtMjU2In19.eyJqdGkiOiI2MDM2MzYwMS05YTkwLTRiMjctYmU4Zi02MzI4ZTU5YzE5NTUiLCJodG0iOiJHRVQiLCJodHUiOiJodHRwczovL3Nzby5taXRkZW5rdC54eXovYWRtaW4vdXNlcnM_cGFnZT0xMCZsaW1pdD01MCIsImlhdCI6MTc1OTk5NzkyNCwibm9uY2UiOiJCOGlDN0d2VU1HQkcyM3VpQUE0UWxlN0lLWDI4RjdpTUkyNmhMZDRveXciLCJhdGgiOiJsTFRlYk1oMmFtSTk3SjdQYXR3SnZmVlo5Z2FtUTBURk1QVkxlYk1tV1R3In0.0WkPrAYhgZ81ECcz5aQ5_ppwxIbvCksOdtUCL4eZotZV6eC9TWBhgvWduBDyHn_ySvDIcPIOl1Opv822HJoQ1g',
        "Authorization": "DPoP eyJhbGciOiJBMTI4S1ciLCJlbmMiOiJBMTI4R0NNIn0.WS0ByQwaZkjb3V5kcXIZlMRwmS-W3ivE.75406IjPTVilpLBw._zORb_ouWpmi016p5cGADVMFB8oAvJbZ4ghPt3Fm9DZ5b-dF-jGMoqZRZFxbac6Otdxuh7OiqBj2InCCgQlTWjU-fd0GvF9Ccvl7TDifDlloW24a58lZsgvSfImpA4jczMprfRrkRIG4tNw0Wz0DryWrWpFK67b2iqgYNZBb80erKR_0r-oghh9z0zW3p9IYLB41QfGxl5X4FOX4pqUNS9X-XPHweh2ABDi03ncYnF4Refn5b6R6UwaasnBNmQ3JADZn08O2Ci7shUeuLokvEQGBS39lmSnhJIHDgnDkwaHFTFMl-gx3grvIQfVbehYpg1MWReAABYdtcbzysW1PUD_CtLWlHKL8Qd7okjMrhGzfwlw5cnTgUU8OBiX_Ua_Cfg15vCJOa6K8DFmO6JtwYn-rtZge9EUgyLluM9GlhqOkudSLk5y8piIciSFo8ACSH-6OSipSsOdDZk0vljmEvVlAzDxhQiYCjmG4RLGYu33G.xJ2Xz6tqCr0AcgRCYZUPbg"
    },
    connections,  // gleichzeitige Verbindungen
    amount: 10,     // total requests
    timeout: 60

});

console.log({
    'Total requests': result.requests.total,
    'Total time': `${result.duration} ms`,
    'Anzahl Buchungen': bookingLimit,
    'Reqs/sec': result.requests.average.toFixed(2),
    'Latency avg': `${result.latency.average} ms`,
    'Gleichzeitige Verbindungen': connections,
    'Fehler': result.errors
})
