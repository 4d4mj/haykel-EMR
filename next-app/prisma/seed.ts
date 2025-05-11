// prisma/seed.ts
import { PrismaClient, Prisma } from '../src/generated/prisma';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log(`Start seeding ...`);

  // === Create Permissions ===
  const permissionsToCreate: Prisma.PermissionCreateInput[] = [
    { name: 'read_patient_record', description: 'Can read patient medical records' },
    { name: 'edit_patient_record', description: 'Can edit patient medical records' },
    { name: 'create_appointment', description: 'Can create new patient appointments' },
    { name: 'cancel_appointment', description: 'Can cancel patient appointments' },
    { name: 'administer_medication', description: 'Can administer medication to patients' },
    { name: 'discharge_patient', description: 'Can formally discharge a patient' },
    { name: 'view_lab_results', description: 'Can view patient lab results' },
    { name: 'manage_users', description: 'Can create, edit, and delete user accounts' },
    { name: 'manage_roles', description: 'Can define and assign roles and permissions' },
    { name: 'view_billing_info', description: 'Can view patient billing information' },
    { name: 'edit_billing_info', description: 'Can edit patient billing information' },
    { name: 'access_audit_logs', description: 'Can access system audit logs' },
  ];

  for (const pData of permissionsToCreate) {
    await prisma.permission.upsert({
      where: { name: pData.name },
      update: {}, // No updates if exists
      create: pData,
    });
  }
  console.log('Permissions seeded.');
  const allPermissions = await prisma.permission.findMany(); // Get all, including their IDs

  // === Create Roles ===
  const rolesToCreate: Prisma.RoleCreateInput[] = [
    { name: 'admin', description: 'System Administrator with super access' },
    { name: 'doctor', description: 'Medical Doctor with patient care responsibilities' },
    { name: 'nurse', description: 'Registered Nurse providing patient care' },
    { name: 'receptionist', description: 'Handles patient check-in and appointments' },
    { name: 'billing_staff', description: 'Manages patient billing and insurance' },
    { name: 'lab_technician', description: 'Performs lab tests and manages results' },
  ];

  for (const rData of rolesToCreate) {
    await prisma.role.upsert({
      where: { name: rData.name },
      update: {}, // No updates if exists
      create: rData,
    });
  }
  console.log('Roles seeded.');
  const allRoles = await prisma.role.findMany(); // Get all roles with their IDs

  // === Assign Permissions to Roles (Creating RolePermission entries) ===

  // Helper function to get permission ID by name
  const getPermissionId = (name: string): number => {
    const perm = allPermissions.find(p => p.name === name);
    if (!perm) throw new Error(`Permission ${name} not found`);
    return perm.id;
  };

  // Helper function to get role ID by name
  const getRoleId = (name: string): number => {
    const role = allRoles.find(r => r.name === name);
    if (!role) throw new Error(`Role ${name} not found`);
    return role.id;
  };

  // Admin gets all permissions
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { // Using the @@id compound key
          roleId: getRoleId('admin'),
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: getRoleId('admin'),
        permissionId: permission.id,
      },
    });
  }

  // Doctor permissions
  const doctorPermissions = [
    'read_patient_record', 'edit_patient_record', 'create_appointment',
    'administer_medication', 'discharge_patient', 'view_lab_results',
  ];
  for (const permName of doctorPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: getRoleId('doctor'), permissionId: getPermissionId(permName) } },
      update: {},
      create: { roleId: getRoleId('doctor'), permissionId: getPermissionId(permName) },
    });
  }

  // Nurse permissions
  const nursePermissions = [
    'read_patient_record', 'create_appointment', 'administer_medication', 'view_lab_results',
  ];
  for (const permName of nursePermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: getRoleId('nurse'), permissionId: getPermissionId(permName) } },
      update: {},
      create: { roleId: getRoleId('nurse'), permissionId: getPermissionId(permName) },
    });
  }

  // Receptionist permissions
  const receptionistPermissions = [
    'create_appointment', 'cancel_appointment', 'read_patient_record',
  ];
  for (const permName of receptionistPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: getRoleId('receptionist'), permissionId: getPermissionId(permName) } },
      update: {},
      create: { roleId: getRoleId('receptionist'), permissionId: getPermissionId(permName) },
    });
  }

  // Billing Staff permissions
  const billingPermissions = ['view_billing_info', 'edit_billing_info'];
  for (const permName of billingPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: getRoleId('billing_staff'), permissionId: getPermissionId(permName) } },
      update: {},
      create: { roleId: getRoleId('billing_staff'), permissionId: getPermissionId(permName) },
    });
  }

  // Lab Technician permissions
  const labTechnicianPermissions = ['view_lab_results'];
  for (const permName of labTechnicianPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: getRoleId('lab_technician'), permissionId: getPermissionId(permName) } },
      update: {},
      create: { roleId: getRoleId('lab_technician'), permissionId: getPermissionId(permName) },
    });
  }
  console.log('Permissions assigned to roles.');


  // === Create Users ===
  const usersToCreate: Prisma.UserCreateInput[] = [
    {
      id: 'clx_admin001',
      name: 'System Admin',
      email: 'admin@hospital.dev',
      passwordHash: hashSync('AdminPass123!', SALT_ROUNDS),
      emailVerified: new Date(),
      roles: { // This creates UserRole entries
        create: [{ role: { connect: { id: getRoleId('admin') } } }],
      },
    },
    {
      id: 'clx_doctor001',
      name: 'Dr. Susan Bones',
      email: 'susan.bones@hospital.dev',
      passwordHash: hashSync('DoctorPass123!', SALT_ROUNDS),
      emailVerified: new Date(),
      roles: {
        create: [{ role: { connect: { id: getRoleId('doctor') } } }],
      },
    },
    {
      id: 'clx_nurse001',
      name: 'John Doe (RN)',
      email: 'john.doe@hospital.dev',
      passwordHash: hashSync('NursePass123!', SALT_ROUNDS),
      emailVerified: new Date(),
      roles: {
        create: [{ role: { connect: { id: getRoleId('nurse') } } }],
      },
    },
    {
      id: 'clx_reception001',
      name: 'Reception Desk',
      email: 'reception@hospital.dev',
      passwordHash: hashSync('ReceptionPass123!', SALT_ROUNDS),
      emailVerified: new Date(),
      roles: {
        create: [{ role: { connect: { id: getRoleId('receptionist') } } }],
      },
    },
    {
      id: 'clx_custom001',
      name: 'Custom Billing User',
      email: 'custom.billing@hospital.dev',
      passwordHash: hashSync('CustomPass123!', SALT_ROUNDS),
      emailVerified: new Date(),
      roles: {
        create: [{ role: { connect: { id: getRoleId('billing_staff') } } }],
      },
      permissions: { // This creates UserPermission entries
        create: [{ permission: { connect: { id: getPermissionId('read_patient_record') } } }],
      },
    },
  ];

  for (const userData of usersToCreate) {
    await prisma.user.upsert({
      where: { email: userData.email! },
      update: {
        // If you want to re-assign roles/permissions if user already exists,
        // you'd need to handle that here (e.g., disconnect old ones, connect new ones).
        // For simplicity, upsert with empty update will keep existing relations if user found.
      },
      create: userData,
    });
  }

  console.log('Users seeded.');
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
