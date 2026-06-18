// import {
//   CreateOrganizationType,
//   Organization,
// } from "@domain/entities/organization";
// import { CreateProjectType, Project } from "@domain/entities/project";
// import { CreateUserType, User } from "@domain/entities/user";
// import { IMUOW } from "@domain/repositories/in-memory/_uow";
// import { hashPassword } from "../password";

// export async function createOrganization(
//   uow: IMUOW,
//   data?: CreateOrganizationType,
// ) {
//   const organizationCreationData: CreateOrganizationType = {
//     name: "Dev Corporation",
//     ...data,
//   };

//   const organization = Organization.create(organizationCreationData);
//   await uow.repositories.organizations.create(organization);

//   return { organization };
// }

// export async function createProject(
//   uow: IMUOW,
//   organization: Organization,
//   data?: Partial<CreateProjectType>,
// ) {
//   const projectCreationData: CreateOrganizationType = {
//     name: "Project Name",
//     showPublicPage: true,
//     publicPageSlug: "this-is-project-slug",

//     ...data,
//   };

//   const project = Project.create({
//     organizationId: organization.getProps().id,
//     ...projectCreationData,
//   });

//   await uow.repositories.projects.create(project);
//   return project;
// }

// export async function createUser(uow: IMUOW, data: CreateUserType) {
//   const user = User.create({
//     ...data,
//     password: await hashPassword(data.password as string),
//   });

//   await uow.repositories.users.create(user);
//   return user;
// }

// export async function createAdminUser(
//   uow: IMUOW,
//   organization: Organization,
//   data?: Partial<CreateUserType>,
// ) {
//   const organizationId = organization.getProps().id;

//   const creationData: CreateUserType = {
//     email: "admuser@email.com",
//     name: "Adm User",
//     password: "password",
//     organizationId,

//     ...data,

//     type: "ADMIN",
//   };

//   const user = await createUser(uow, creationData);

//   return {
//     user,
//     creationData,
//   };
// }

// export async function createDevUser(
//   uow: IMUOW,
//   organization: Organization,
//   data?: Partial<CreateUserType>,
// ) {
//   const organizationId = organization.getProps().id;

//   const creationData: CreateUserType = {
//     email: "devuser@email.com",
//     name: "Dev User",
//     password: "password",
//     organizationId,

//     ...data,

//     type: "DEV",
//   };

//   const user = await createUser(uow, creationData);

//   return {
//     user,
//     creationData,
//   };
// }
