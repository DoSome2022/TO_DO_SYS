
import { adminUserRouter } from "./routers/adminUser";
import { attachmentRouter } from "./routers/attachment";
import { CommentRouter } from "./routers/comment";
import { companyProfileRouter } from "./routers/companyProfile";
import { customerRouter } from "./routers/customer";
import { DeliverableRouter } from "./routers/deliverable";
import { dynamicFeatureRouter } from "./routers/dynamicFeature";
import { equipmentRouter } from "./routers/equipment";
import { messageRouter } from "./routers/message";
import { OssRouter } from "./routers/oss";
import { phaseRouter } from "./routers/phase";
import { ProjectRouter } from "./routers/project";
import { projectCommentRouter } from "./routers/projectComment";
import { quotationRouter } from "./routers/quotation";
import { reviewRouter } from "./routers/review";

import { salesCustomerRouter } from "./routers/salesCustomer";
import { serviceRouter } from "./routers/service";
import { staffRouter } from "./routers/staff";
import { staffPermissionRouter } from "./routers/staffpermission";
import { staffPositionRouter } from "./routers/staffposition";
import { todoRouter } from "./routers/todo";

import { userRouter } from "./routers/user";
import { workItemRouter } from "./routers/workitem";
import { WorkVersionRouter } from "./routers/workVersion";
import { createCallerFactory, router } from "./trpc";


export const appRouter = router({
    user: userRouter,
    // PMTodo: PMtodoRouter,
    // StaffTodo: StafftodoRouter,
    todo: todoRouter,
    project: ProjectRouter,
    workitem: workItemRouter,
    staffPosition: staffPositionRouter,
    staffPermission: staffPermissionRouter,
    dynamicFeature: dynamicFeatureRouter,
    customer: customerRouter,
    phase: phaseRouter,
    WorkVersion: WorkVersionRouter,
    Comment: CommentRouter,
    projectComment: projectCommentRouter,
    Deliverable: DeliverableRouter,
    attachment: attachmentRouter,
    equipment: equipmentRouter,
    quotation: quotationRouter,
    salesCustomer: salesCustomerRouter,
    service: serviceRouter,
    companyProfile:companyProfileRouter,
    adminUser: adminUserRouter,
    message: messageRouter,
    oss: OssRouter,
    review: reviewRouter,
    staff: staffRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);