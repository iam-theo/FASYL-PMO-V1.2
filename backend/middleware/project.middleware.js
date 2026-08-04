// import { ROLES } from "../constants/roles";
// import { prisma } from "../prisma/prisma.client";

// export const canManageProject = async (req, res, next) => {

//     const projectId = req.params.projectId || req.params.id;
//     const { userId, role } = req.user;

//     try{

//         if (role === ROLES.HEADOFOPS) return next();

//         const project = await prisma.project.findUnique({

//             where: {
//                 projectId: projectId
//             },

//             select: {
//                 id: true,
//                 projectManagerId: true
//             }
//         });

//         if(!project) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Project not found"
//             })
//         }

//         if(userId !== project.projectManagerId) {
//             return res.status(403).json({
//                 success: false,
//                 message: "You are not allowed to manage this project"
//             })
//         }

//         req.context = {
//             ...req.context,
//             project,
//         }

//         next();
//     } catch(err) {

//         next(err);
//     }
// }