const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

// Models
const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Drive = require('../models/Drive');
const Application = require('../models/Application');
const Offer = require('../models/Offer');
const PlacementPolicy = require('../models/PlacementPolicy');
const PlacementRecord = require('../models/PlacementRecord');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function seed() {
  try {
    await connectDB();
    console.log('[SEED] Connected to DB. Clearing old data...');

    await Promise.all([
      User.deleteMany(), Student.deleteMany(), Company.deleteMany(),
      Drive.deleteMany(), Application.deleteMany(), Offer.deleteMany(),
      PlacementPolicy.deleteMany(), PlacementRecord.deleteMany(),
      AuditLog.deleteMany(), Notification.deleteMany()
    ]);

    const adminHash = await bcrypt.hash('Admin@123', 12);
    const officerHash = await bcrypt.hash('Officer@123', 12);
    const studentHash = await bcrypt.hash('Student@123', 12);

    console.log('[SEED] Creating Users...');
    const users = await User.insertMany([
      { name: 'System Admin', email: 'admin@tpcflow.local', passwordHash: adminHash, role: 'ADMIN' },
      { name: 'TPC Officer', email: 'officer@tpcflow.local', passwordHash: officerHash, role: 'TPC_OFFICER' },
      { name: 'Rahul Sharma', email: 'rahul@tpcflow.local', passwordHash: studentHash, role: 'STUDENT' },
      { name: 'Priya Singh', email: 'priya@tpcflow.local', passwordHash: studentHash, role: 'STUDENT' },
      ...Array.from({ length: 10 }).map((_, i) => ({
        name: `Student Demo ${i + 5}`,
        email: `student${i + 5}@tpcflow.local`,
        passwordHash: studentHash,
        role: 'STUDENT'
      }))
    ]);

    const admin = users[0];
    const officer = users[1];
    const rahulUser = users[2];
    const priyaUser = users[3];
    const extraStudents = users.slice(4);

    console.log('[SEED] Creating Student Profiles...');
    const branches = ['CSE', 'IT', 'ECE', 'ME', 'EE'];
    const deps = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Electrical'];

    const rahulProfile = {
      userId: rahulUser._id, studentId: 'CSE2027001', name: rahulUser.name, email: rahulUser.email,
      branch: 'CSE', cgpa: 8.2, backlogs: 0, activeBacklogs: 0, graduationYear: 2027,
      batch: '2023-27', department: 'Computer Science',
      skills: ['JavaScript', 'React', 'Node.js', 'Python'], phone: '+91 98765 43210'
    };
    const priyaProfile = {
      userId: priyaUser._id, studentId: 'CSE2027002', name: priyaUser.name, email: priyaUser.email,
      branch: 'CSE', cgpa: 6.9, backlogs: 0, activeBacklogs: 0, graduationYear: 2027,
      batch: '2023-27', department: 'Computer Science',
      skills: ['Java', 'Spring Boot'], phone: '+91 91234 56780'
    };

    const students = await Student.insertMany([
      rahulProfile,
      priyaProfile,
      ...extraStudents.map((u, i) => {
        const branchIdx = i % branches.length;
        return {
          userId: u._id,
          studentId: `${branches[branchIdx]}202700${i + 3}`,
          name: u.name,
          email: u.email,
          branch: branches[branchIdx],
          cgpa: Math.round((6.0 + Math.random() * 3.5) * 10) / 10,
          backlogs: i % 3,
          activeBacklogs: i % 5 === 0 ? 1 : 0,
          graduationYear: 2027,
          batch: '2023-27',
          department: deps[branchIdx],
          skills: ['C++', 'Python']
        };
      })
    ]);

    console.log('[SEED] Creating Companies...');
    const companies = await Company.insertMany([
      { name: 'ABC Technologies', industry: 'Software Products', location: 'Hyderabad', website: 'https://abctech.example.com', contactPerson: 'Kavya Rao', contactEmail: 'talent@abctech.example.com', description: 'Product engineering company building platforms for global clients.' },
      { name: 'Infosys', industry: 'IT Services', location: 'Bengaluru' },
      { name: 'TCS', industry: 'IT Services', location: 'Chennai' },
      { name: 'Wipro', industry: 'IT Services', location: 'Bengaluru' },
      { name: 'Amazon', industry: 'E-commerce / Cloud', location: 'Multiple' },
      { name: 'Microsoft', industry: 'Software', location: 'Hyderabad' }
    ]);

    console.log('[SEED] Creating Drives...');
    const seededDrives = await Drive.insertMany([
      {
        companyId: companies[0]._id, title: 'Software Developer', jobRole: 'Software Developer',
        jobType: 'FULL_TIME', package: 8, currency: 'INR', location: 'Hyderabad / Hybrid',
        description: 'Full-stack product development role. Selection: technical test → two interviews.',
        applicationStart: daysFromNow(-2), applicationDeadline: daysFromNow(14), driveDate: daysFromNow(21),
        graduationYears: [2027], eligibleBranches: ['CSE', 'IT'],
        eligibilityRules: {
          ruleGroup: 'ALL',
          rules: [
            { field: 'cgpa', operator: 'GREATER_THAN_OR_EQUAL', value: 7.5 },
            { field: 'branch', operator: 'IN', value: ['CSE', 'IT'] },
            { field: 'activeBacklogs', operator: 'EQUAL', value: 0 },
            { field: 'graduationYear', operator: 'EQUAL', value: 2027 }
          ]
        },
        status: 'PUBLISHED', createdBy: officer._id, publishedAt: daysFromNow(-1)
      },
      {
        companyId: companies[1]._id, title: 'Systems Engineer', jobRole: 'Systems Engineer',
        jobType: 'FULL_TIME', package: 4.5, currency: 'INR', location: 'Across India',
        description: 'Open-for-all services role across CSE, IT and ECE.',
        applicationStart: daysFromNow(-1), applicationDeadline: daysFromNow(20), driveDate: daysFromNow(28),
        graduationYears: [2027], eligibleBranches: ['CSE', 'IT', 'ECE'],
        eligibilityRules: {
          ruleGroup: 'ALL',
          rules: [
            { field: 'cgpa', operator: 'GREATER_THAN_OR_EQUAL', value: 6.0 },
            { field: 'branch', operator: 'IN', value: ['CSE', 'IT', 'ECE'] }
          ]
        },
        status: 'PUBLISHED', createdBy: officer._id, publishedAt: daysFromNow(-1)
      },
      {
        companyId: companies[4]._id, title: 'SDE Internship', jobRole: 'SDE Intern',
        jobType: 'INTERN', package: 18, currency: 'INR', location: 'Remote',
        description: 'Six-month internship with pre-placement offer potential.',
        applicationStart: daysFromNow(-1), applicationDeadline: daysFromNow(10), driveDate: daysFromNow(15),
        graduationYears: [2027], eligibleBranches: ['CSE', 'IT'],
        eligibilityRules: {
          ruleGroup: 'ALL',
          rules: [
            { field: 'cgpa', operator: 'GREATER_THAN_OR_EQUAL', value: 8.0 },
            { field: 'activeBacklogs', operator: 'EQUAL', value: 0 }
          ]
        },
        status: 'PUBLISHED', createdBy: officer._id, publishedAt: daysFromNow(-1)
      },
      {
        companyId: companies[5]._id, title: 'Cloud Engineer', jobRole: 'Cloud Engineer',
        jobType: 'FULL_TIME', package: 22, currency: 'INR', location: 'Hyderabad',
        description: 'Premium cloud role — draft pending final JD from Microsoft.',
        applicationStart: null, applicationDeadline: null, driveDate: null,
        graduationYears: [], eligibleBranches: [],
        eligibilityRules: { ruleGroup: 'ALL', rules: [] },
        status: 'DRAFT', createdBy: officer._id
      }
    ]);

    console.log('[SEED] Creating sample Applications...');
    const placedProfiles = students.slice(2, 8);
    const placedIds = new Set(placedProfiles.map((s) => String(s._id)));
    const unplacedStudents = students.filter((s) => !placedIds.has(String(s._id)));
    const mkApp = (student, drive, status) => ({
      driveId: drive._id,
      studentId: student._id,
      eligibilitySnapshot: {
        eligible: true,
        ruleGroup: 'ALL',
        results: [],
        failedRules: [],
        passedRules: [],
        summary: 'Eligible at time of application (seeded)',
      },
      status,
      appliedAt: daysFromNow(-1),
      shortlistedAt: status === 'SHORTLISTED' || status === 'INTERVIEW' || status === 'SELECTED' ? daysFromNow(-1) : undefined,
      interviewAt: status === 'INTERVIEW' || status === 'SELECTED' ? daysFromNow(-1) : undefined,
      selectedAt: status === 'SELECTED' ? daysFromNow(-1) : undefined,
      statusHistory: [{ status: 'APPLIED', changedBy: officer._id }, ...(status !== 'APPLIED' ? [{ status, changedBy: officer._id }] : [])]
    });
    await Application.insertMany([
      mkApp(students[0], seededDrives[0], 'APPLIED'),
      mkApp(unplacedStudents[2], seededDrives[0], 'SHORTLISTED'),
      mkApp(unplacedStudents[3], seededDrives[0], 'APPLIED'),
      mkApp(unplacedStudents[4], seededDrives[1], 'APPLIED'),
      mkApp(unplacedStudents[5], seededDrives[2], 'APPLIED')
    ]);

    console.log('[SEED] Creating Policies...');
    await PlacementPolicy.insertMany([
      {
        name: 'Maximum Accepted Offers', type: 'MAX_ACCEPTED_OFFERS',
        configuration: { maximum: 1 }, scope: 'INSTITUTION',
        isActive: true, effectiveFrom: new Date('2026-01-01'), version: 1, createdBy: admin._id
      },
      {
        name: 'Placed Student Restriction', type: 'PLACED_STUDENT_RESTRICTION',
        configuration: {}, scope: 'INSTITUTION',
        isActive: true, effectiveFrom: new Date('2026-01-01'), version: 1, createdBy: admin._id
      },
      {
        name: 'Premium Package Gateway', type: 'MIN_PACKAGE_FOR_ADDITIONAL_APPLICATION',
        configuration: { minimumPackage: 10 }, scope: 'INSTITUTION',
        isActive: false, effectiveFrom: new Date('2026-01-01'), version: 1, createdBy: admin._id
      }
    ]);

    console.log('[SEED] Creating historical placements for reporting...');
    const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const historicPackages = [4.5, 5.5, 6, 7, 8.5, 12];

    for (let i = 0; i < placedProfiles.length; i++) {
      const st = placedProfiles[i];
      const pkg = historicPackages[i % historicPackages.length];
      const fakeOfferId = new mongoose.Types.ObjectId();
      await PlacementRecord.create({
        studentId: st._id,
        companyId: companies[(i % companies.length)]._id,
        offerId: fakeOfferId,
        package: pkg,
        placementDate: daysFromNow(-(10 + i * 3)),
        academicYear,
        graduationYear: st.graduationYear,
        department: st.department,
        branch: st.branch,
        status: 'PLACED'
      });
      await Student.findByIdAndUpdate(st._id, {
        placementStatus: 'PLACED',
        careerOutcome: 'PLACED',
        acceptedOffersCount: 1,
        highestAcceptedPackage: pkg
      });
    }

    // Seed a welcome notification for Rahul & Priya
    await Notification.insertMany([
      { userId: rahulUser._id, title: 'Welcome to TPC Flow', message: 'New drives are open. Check your eligibility on each drive page.', type: 'INFO' },
      { userId: priyaUser._id, title: 'Welcome to TPC Flow', message: 'New drives are open. Check your eligibility on each drive page.', type: 'INFO' }
    ]);

    await AuditLog.create({
      userId: admin._id,
      action: 'SEED_DATABASE',
      entityType: 'System',
      metadata: { note: 'Demo dataset generated' }
    });

    console.log('[SEED] Database seeding completed successfully!');
    console.log('[SEED] Logins -> officer@tpcflow.local / Officer@123 | admin@tpcflow.local / Admin@123 | rahul@tpcflow.local & priya@tpcflow.local / Student@123');
    process.exit(0);
  } catch (error) {
    console.error('[SEED_ERROR]', error);
    process.exit(1);
  }
}

seed();
