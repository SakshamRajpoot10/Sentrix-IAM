/**
 * 🛡️ SENTRIX SDK — JavaScript/Node.js
 *
 * Official SDK for integrating AI agents with the Sentrix
 * governance, authorization, and anomaly detection platform.
 *
 * @example
 * const { SentrixClient } = require('sentrix-sdk');
 *
 * const client = new SentrixClient('https://your-server.com', 'your-api-key');
 * await client.authenticate();
 * const decision = await client.authorize('READ', '/api/v1/users');
 *
 * @module sentrix-sdk
 */

const SentrixClient = require('./client');

module.exports = SentrixClient;
module.exports.SentrixClient = SentrixClient;
module.exports.default = SentrixClient;
