"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { createServer } from 'node:http'
const server_1 = __importDefault(require("./server"));
// const server = createServer((req,res)=>{
//     res.write('Hello')
//     res.end()
// }).listen('8888')
// const apiKey = 'aLzxE4loVnMbF2WVpV1SPeiSP9mteNt6GufOYHrgNQBQ1JwYOS76LFhLlEOw931z'
// const apiSecret = '2NJjltIvF5P4BoPNRj3CQWRPoVszZtxnxdrBYaKOPjI703vVgfDd6FD60Oygvf0s'
// const client = new Spot(apiKey, apiSecret)
//client.account().then(response => client.logger.log(response.data))
// client.userAsset()
//   .then(response => client.logger.log(response.data))
//   .catch(error => client.logger.error(error))
const server = new server_1.default(8000);
server.startWwebsockets();
