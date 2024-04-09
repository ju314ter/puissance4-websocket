// import { createServer } from 'node:http'
import Server from "./server";

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

const server = new Server(8000)

server.startWwebsockets()