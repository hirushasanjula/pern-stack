import arcjet, {tokenBucket, shield, detectBot} from "@arcjet/node";

import "dotenv/config";

export const aj = arcjet({
    key: process.env.ARCJET_KEY,
    characteristics: ["ip.src"],
    rules: [
        // Rate limiting to 10 requests per minute
        shield({mode: "LIVE"}),
        detectBot({
            mode: "LIVE",
            // block all bots except for the ones in the allowlist
            allow: ["CATEGORY:SEARCH_ENGINE"]
        }),
        // rate limiting to 10 requests per minute
        tokenBucket({
            mode: "LIVE",
            refillRate: 30,
            interval: 5,
            capacity: 20,

        })
    ]
});

