import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function ping(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {    
    return { body: `pong` };
};

app.http('ping', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: ping
});
