import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import taskRoute from './router/task';
import userRoute from './router/user';

const app = new Hono()

app.route('/user', userRoute);
app.route("/task", taskRoute);

export const handler = handle(app)
