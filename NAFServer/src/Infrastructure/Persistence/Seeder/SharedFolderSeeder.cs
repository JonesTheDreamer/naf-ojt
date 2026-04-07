using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Infrastructure.Persistence.Seeder
{
    public class SharedFolderSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (context.Resources.Any()) return;
            var ags = new SharedFolder("AGS", "Individual Folder (User)", "AGS");
            var accounting = new SharedFolder("Accounting", "Individual Folder (User)", "AD");
            var commonFileAccounting = new SharedFolder("Common File Accounting", "Shared Folder For Files", "AD");
            var audit = new SharedFolder("Audit", "Individual Folder (User)", "HO-IA");
            var commonFileAudit = new SharedFolder("Common File Audit", "Shared Folder For Files", "HO-IA");
            //var analab = new SharedFolder("Analab", "Individual Folder (User)");
            //var commonFileAnalab = new SharedFolder("Common File Analab", "Shared Folder For Files");
            //var cwd = new SharedFolder("CWWD", "Individual Folder (User)");
            //var commonFileCwd = new SharedFolder("Common File Cwd", "Shared Folder For Files");
            //var drilling = new SharedFolder("Drilling", "Individual Folder (User)");
            //var commonFileDrilling = new SharedFolder("Common File Drilling", "Shared Folder For Files");
            //var electrical = new SharedFolder("Electrical", "Individual Folder (User)");
            //var commonFileElectrical = new SharedFolder("Common File Electrical", "Shared Folder For Files");
            //var electronics = new SharedFolder("Electronics", "Individual Folder (User)");
            //var commonFileElectronics = new SharedFolder("Common File Electronics", "Shared Folder For Files");
            //var executive = new SharedFolder("Executive", "Individual Folder (User)");
            //var foodcourt = new SharedFolder("Foodcourt", "Individual Folder (User)");
            //var foodmatch = new SharedFolder("Foodmatch", "Individual Folder (User)");
            //var geology = new SharedFolder("Geology", "Individual Folder (User)");
            //var commonFileGeologyPanama = new SharedFolder("Common File Geology Panama", "Shared Folder For Files");
            //var commonFileExploration = new SharedFolder("Common File Exploration", "Shared Folder For Files");
            //var commonFileGeoexplo = new SharedFolder("Common File Geoexplo", "Shared Folder For Files");
            //var minegeology = new SharedFolder("Minegeology", "Shared Folder For Files");
            //var hospital = new SharedFolder("Hospital", "Individual Folder (User)");
            //var commonFileHospital = new SharedFolder("Common File Hospital", "Shared Folder For Files");
            //var hrd = new SharedFolder("Hrd", "Individual Folder (User)");
            //var commonFileHrd = new SharedFolder("Common File Hrd", "Shared Folder For Files");
            //var hrdGovernmentRemittances = new SharedFolder("Hrd Government Remittances", "Shared Folder For Files");
            //var logsem = new SharedFolder("Logsem", "Shared Folder For Files");
            //var hangar = new SharedFolder("Hangar", "Individual Folder (User)");
            //var humic = new SharedFolder("Humic", "Shared Folder For Files");
            //var ict = new SharedFolder("Ict", "Individual Folder (User)");
            //var ictShared = new SharedFolder("Ict Shared", "Shared Folder For Files");
            //var iso = new SharedFolder("Iso", "Individual Folder (User)");
            //var commonFileIms = new SharedFolder("Common File Ims", "Shared Folder For Files");
            //var documentManagementSystemAdmin = new SharedFolder("Document Management System (Admin)", "Shared Folder For Files");
            //var mcd = new SharedFolder("Mcd", "Individual Folder (User)");
            //var commonFileMcd = new SharedFolder("Common File Mcd", "Shared Folder For Files");
            //var approvedPr = new SharedFolder("Approved Pr", "Shared Folder For Files");
            //var purchasingReport = new SharedFolder("Purchasing Report", "Shared Folder For Files");
            //var mobile = new SharedFolder("Mobile", "Individual Folder (User)");
            //var commonFileMobile = new SharedFolder("Common File Mobile", "Shared Folder For Files");
            //var commonFileMobileMtso = new SharedFolder("Common File Mobile Mtso", "Shared Folder For Files");
            //var commonFileKingston = new SharedFolder("Common File Kingston", "Shared Folder For Files");
            //var mped = new SharedFolder("Mped", "Individual Folder (User)");
            //var mpedSharedFile = new SharedFolder("Mped Shared File", "Shared Folder For Files");
            //var commonFileGeomped = new SharedFolder("Common File Geomped", "Shared Folder For Files");
            //var msd = new SharedFolder("Msd", "Individual Folder (User)");
            //var commonFileMsd = new SharedFolder("Common File Msd", "Shared Folder For Files");
            //var mtso = new SharedFolder("Mtso", "Individual Folder (User)");
            //var commonFileMtso = new SharedFolder("Common File Mtso", "Shared Folder For Files");
            //var ssg = new SharedFolder("Ssg", "Individual Folder (User)");
            //var pottery = new SharedFolder("Pottery", "Individual Folder (User)");
            //var commonFilePottery = new SharedFolder("Common File Pottery", "Shared Folder For Files");
            //var powerPlant = new SharedFolder("Power Plant", "Shared Folder For Files");
            //var product = new SharedFolder("Product", "Individual Folder (User)");
            //var commonFileProduct = new SharedFolder("Common File Product", "Shared Folder For Files");
            //var safety = new SharedFolder("Safety", "Individual Folder (User)");
            //var commonFileSafety = new SharedFolder("Common File Safety", "Shared Folder For Files");
            //var commonFileSafetyNoncore = new SharedFolder("Common File Safety Noncore", "Shared Folder For Files");
            //var commonFileShippingMayflower = new SharedFolder("Common File Shipping Mayflower", "Shared Folder For Files");
            //var commonFileShippingNoflower = new SharedFolder("Common File Shipping Noflower", "Shared Folder For Files");
            //var tabunan = new SharedFolder("Tabunan", "Individual Folder (User)");
            //var commonFileTabunan = new SharedFolder("Common File Tabunan", "Shared Folder For Files");
            //var ttsp = new SharedFolder("Ttsp", "Shared Folder For Files");
            //var commonFileSdmp = new SharedFolder("Common File Sdmp", "Shared Folder For Files");
            //var reforestation = new SharedFolder("Reforestration", "Shared Folder For Files");
            //var media = new SharedFolder("Media", "Shared Folder For Files");
            //var commonMsho = new SharedFolder("Common Msho", "Shared Folder For Files");
            //var commonFileSafetyMsho = new SharedFolder("Common File Safety Msho", "Shared Folder For Files");
            //var commonFileGeomos = new SharedFolder("Common File Geomos", "Shared Folder For Files");
            //var geomos = new SharedFolder("Geomos", "Shared Folder For (User)");
            //var shipping = new SharedFolder("Shipping", "Shared Folder For (User)");
            //var rmoadmin = new SharedFolder("Rmoadmin", "Shared Folder For (User)");
            //var dpcTechnicalFolder = new SharedFolder("Dpc Technical Folder", "N/A");
            //var smpcRiskAdvisoryFolder = new SharedFolder("Smpc Risk Advisory Folder", "N/A");
            //var smpcSafetyCommitteeFolder = new SharedFolder("Smpc Safety Committee Folder", "N/A");
            //var smpcPurchasingFolder = new SharedFolder("Smpc Purchasing Folder", "N/A");
            //var smpcPurchasingReportsFolder = new SharedFolder("Smpc Purchasing Reports Folder", "N/A");
            //var updiPropertyManagementFolder = new SharedFolder("Updi Property Management Folder", "N/A");
            //var dpcProjectDevelopmentFolder = new SharedFolder("Dpc Project Development Folder", "N/A");
            //var dpcProcurement = new SharedFolder("Dpc Procurement", "N/A");
            //var smpcProcessAndReEngineeringFolder = new SharedFolder("Smpc Process And ReEngineering Folder", "N/A");
            //var smpcProcessFolder = new SharedFolder("Smpc Process Folder", "N/A");
            //var daconMarketingFolder = new SharedFolder("Dacon Marketing Folder", "N/A");
            //var smpcMarketingFolder = new SharedFolder("Smpc Marketing Folder", "N/A");
            //var dpcLegalFolder = new SharedFolder("Dpc Legal Folder", "N/A");
            //var smpcAuditFolder = new SharedFolder("Smpc Audit Folder", "N/A");
            //var commonIctTechnicalFolder = new SharedFolder("Common Ict Technical Folder", "N/A");
            //var dpcHrdFolder = new SharedFolder("Dpc Hrd Folder", "N/A");
            //var otpPerformanceAppraisal = new SharedFolder("Otp Performance Appraisal", "N/A");
            //var smpcHradFolder = new SharedFolder("Smpc Hrad Folder", "N/A");
            //var smpcCsrFolder = new SharedFolder("Smpc Csr Folder", "N/A");
            //var smpcGoodGovernanceFolder = new SharedFolder("Smpc Good Governance Folder", "N/A");
            //var smpcShielaFileFolder = new SharedFolder("Smpc Shiela File Folder", "N/A");
            //var smpcTreasuryFolder = new SharedFolder("Smpc Treasury Folder", "N/A");
            //var dpcQeshFolder = new SharedFolder("Dpc Qesh Folder", "N/A");
            //var daconAuditFolder = new SharedFolder("Dacon Audit Folder", "N/A");
            //var isoSharedFolder = new SharedFolder("Iso Shared Folder", "N/A");
            //var ltoRegistrationFolder = new SharedFolder("Lto Registration Folder", "N/A");

            context.SharedFolders.AddRange(
                ags, accounting, commonFileAccounting, audit, commonFileAudit
            //,analab, commonFileAnalab,
            //cwd, commonFileCwd, drilling, commonFileDrilling, electrical, commonFileElectrical,
            //electronics, commonFileElectronics, executive, foodcourt, foodmatch, geology,
            //commonFileGeologyPanama, commonFileExploration, commonFileGeoexplo, minegeology,
            //hospital, commonFileHospital, hrd, commonFileHrd, hrdGovernmentRemittances,
            //logsem, hangar, humic, ict, ictShared, iso, commonFileIms, documentManagementSystemAdmin,
            //mcd, commonFileMcd, approvedPr, purchasingReport, mobile, commonFileMobile,
            //commonFileMobileMtso, commonFileKingston, mped, mpedSharedFile, commonFileGeomped,
            //msd, commonFileMsd, mtso, commonFileMtso, ssg, pottery, commonFilePottery,
            //powerPlant, product, commonFileProduct, safety, commonFileSafety, commonFileSafetyNoncore,
            //commonFileShippingMayflower, commonFileShippingNoflower, tabunan, commonFileTabunan,
            //ttsp, commonFileSdmp, reforestration, media, commonMsho, commonFileSafetyMsho,
            //commonFileGeomos, geomos, shipping, rmoadmin, dpcTechnicalFolder, smpcRiskAdvisoryFolder,
            //smpcSafetyCommitteeFolder, smpcPurchasingFolder, smpcPurchasingReportsFolder,
            //updiPropertyManagementFolder, dpcProjectDevelopmentFolder, dpcProcurement,
            //smpcProcessAndReEngineeringFolder, smpcProcessFolder, daconMarketingFolder,
            //smpcMarketingFolder, dpcLegalFolder, smpcAuditFolder, commonIctTechnicalFolder,
            //dpcHrdFolder, otpPerformanceAppraisal, smpcHradFolder, smpcCsrFolder,
            //smpcGoodGovernanceFolder, smpcShielaFileFolder, smpcTreasuryFolder, dpcQeshFolder,
            //daconAuditFolder, isoSharedFolder, ltoRegistrationFolder
            );
        }
    }
}
