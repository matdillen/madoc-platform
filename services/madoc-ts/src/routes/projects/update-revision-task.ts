import { api } from '../../gateway/api.server';
import { userWithScope } from '../../utility/user-with-scope';
import { RouteMiddleware } from '../../types/route-middleware';
import { CrowdsourcingTask } from '../../gateway/tasks/crowdsourcing-task';
import { userCan } from '../../utility/user-can';

export const updateRevisionTask: RouteMiddleware<{ taskId: string; task: any }> = async context => {
  const { siteId } = userWithScope(context, ['models.contribute', 'models.revision']);

  const canCreate = userCan('models.create', context.state);
  const canReview = userCan('models.revision', context.state);

  const userApi = api.asUser({ siteId });
  const id = context.params.taskId;
  const taskBody = context.requestBody.task;

  const task = await userApi.getTask(id);

  if (!id) {
    throw new Error('Task could not be updated');
  }

  if (!taskBody) {
    throw new Error('Task could not be updated, no body');
  }

  if (task.type !== 'crowdsourcing-task') {
    throw new Error(`Task could not be updated, not a valid task`);
  }
  if (!canCreate && !canReview) {
    throw new Error('Not authorised');
  }

  await userApi.updateTask<CrowdsourcingTask>(id, taskBody);
  context.response.status = 200;
};
