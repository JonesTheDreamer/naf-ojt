using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Infrastructure.Persistence.Seeder
{
    public class EmployeeDepartmentSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (context.Employees.Any()) return;

            var employees = new List<Employee>();
            var departments = new List<Department>();

            // ── SALES & BUSINESS DEVELOPMENT ──────────────────────────────
            employees.AddRange(new[] {
                new Employee("EMP00001", "Roberto",   "M.", "Cruz",       null,      "Active", "Acme Corporation", "Sales Director",                  "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("9229523", "Maria",     "B.", "Santos",     "EMP00001","Active", "Acme Corporation", "Senior Sales Manager",             "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00003", "Jose",      "R.", "Reyes",      "EMP00001","Active", "Acme Corporation", "Business Development Manager",     "Branch A",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00004", "Ana",       "L.", "Flores",     "EMP00001","Active", "Acme Corporation", "Key Accounts Manager",             "Branch B",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00005", "Carlos",    "T.", "Bautista",   "9229523","Active", "Acme Corporation", "Sales Executive",                  "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00006", "Diana",     "P.", "Lim",        "9229523","Active", "Acme Corporation", "Sales Executive",                  "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00007", "Eduardo",   "N.", "Garcia",     "9229523","Active", "Acme Corporation", "Sales Executive",                  "Branch A",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00008", "Fatima",    "A.", "Torres",     "9229523","Active", "Acme Corporation", "Sales Executive",                  "Branch A",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00009", "Gabriel",   "S.", "Mendoza",    "9229523","Active", "Acme Corporation", "Sales Executive",                  "Branch B",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00010", "Hannah",    "V.", "Ramos",      "9229523","Active", "Acme Corporation", "Sales Executive",                  "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00011", "Ivan",      "C.", "Dela Cruz",  "9229523","Active", "Acme Corporation", "Sales Associate",                  "Branch A",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00012", "Jessica",   "F.", "Navarro",    "9229523","Active", "Acme Corporation", "Sales Associate",                  "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00013", "Kevin",     "H.", "Villanueva", "EMP00003","Active", "Acme Corporation", "Business Development Executive",   "Branch A",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00014", "Laura",     "M.", "Castillo",   "EMP00003","Active", "Acme Corporation", "Business Development Executive",   "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00015", "Marco",     "A.", "Soriano",    "EMP00003","Active", "Acme Corporation", "Business Development Executive",   "Branch B",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00016", "Nina",      "O.", "Aquino",     "EMP00003","Active", "Acme Corporation", "Business Development Executive",   "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00017", "Oliver",    "D.", "Mercado",    "EMP00003","Active", "Acme Corporation", "Business Development Executive",   "Branch A",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00018", "Patricia",  "E.", "Hernandez",  "EMP00003","Active", "Acme Corporation", "Business Development Associate",   "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00019", "Quincy",    "I.", "Gutierrez",  "EMP00003","Active", "Acme Corporation", "Business Development Associate",   "Branch B",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00020", "Rachel",    "J.", "Ong",        "EMP00003","Active", "Acme Corporation", "Business Development Associate",   "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00021", "Samuel",    "K.", "Ferrer",     "EMP00004","Active", "Acme Corporation", "Account Executive",                "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00022", "Teresa",    "L.", "Padilla",    "EMP00004","Active", "Acme Corporation", "Account Executive",                "Branch A",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00023", "Ulysses",   "M.", "Chua",       "EMP00004","Active", "Acme Corporation", "Account Executive",                "Branch B",    "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00024", "Vanessa",   "N.", "dela Torre", "EMP00004","Active", "Acme Corporation", "Account Executive",                "Main Office", "SALES", "EMP00001", "Sales & Business Development"),
                new Employee("EMP00025", "Walter",    "O.", "Pascual",    "EMP00004","Active", "Acme Corporation", "Account Executive",                "Branch A",    "SALES", "EMP00001", "Sales & Business Development"),
            });
            departments.Add(new Department("SALES", "Sales & Business Development", "EMP00001"));

            // ── MARKETING & COMMUNICATIONS ────────────────────────────────
            employees.AddRange(new[] {
                new Employee("EMP00026", "Carmen",    "A.", "Ramos",      null,      "Active", "Acme Corporation", "Marketing Director",               "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00027", "Luis",      "B.", "Torres",     "EMP00026","Active", "Acme Corporation", "Digital Marketing Manager",        "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00028", "Sofia",     "C.", "Mendoza",    "EMP00026","Active", "Acme Corporation", "Brand & Communications Manager",   "Branch A",    "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00029", "Diego",     "D.", "Ramirez",    "EMP00026","Active", "Acme Corporation", "Content Marketing Manager",        "Branch B",    "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00030", "Elena",     "E.", "Santos",     "EMP00027","Active", "Acme Corporation", "Digital Marketing Specialist",     "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00031", "Felix",     "F.", "Reyes",      "EMP00027","Active", "Acme Corporation", "SEO Specialist",                   "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00032", "Gloria",    "G.", "Bautista",   "EMP00027","Active", "Acme Corporation", "Social Media Specialist",          "Branch A",    "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00033", "Hector",    "H.", "Lim",        "EMP00027","Active", "Acme Corporation", "Email Marketing Specialist",       "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00034", "Iris",      "I.", "Garcia",     "EMP00027","Active", "Acme Corporation", "Digital Ads Specialist",           "Branch B",    "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00035", "Jorge",     "J.", "Dela Cruz",  "EMP00027","Active", "Acme Corporation", "Web Analyst",                      "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00036", "Karen",     "K.", "Navarro",    "EMP00027","Active", "Acme Corporation", "Marketing Coordinator",            "Branch A",    "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00037", "Leo",       "L.", "Castillo",   "EMP00027","Active", "Acme Corporation", "Marketing Coordinator",            "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00038", "Mia",       "M.", "Villanueva", "EMP00028","Active", "Acme Corporation", "Brand Strategist",                 "Branch A",    "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00039", "Nathan",    "N.", "Soriano",    "EMP00028","Active", "Acme Corporation", "Graphic Designer",                 "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00040", "Olivia",    "O.", "Aquino",     "EMP00028","Active", "Acme Corporation", "Graphic Designer",                 "Branch A",    "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00041", "Pedro",     "P.", "Mercado",    "EMP00028","Active", "Acme Corporation", "Communications Specialist",        "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00042", "Queenie",   "Q.", "Hernandez",  "EMP00028","Active", "Acme Corporation", "PR Specialist",                    "Branch B",    "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00043", "Rex",       "R.", "Gutierrez",  "EMP00028","Active", "Acme Corporation", "Brand Coordinator",                "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00044", "Sara",      "S.", "Ong",        "EMP00028","Active", "Acme Corporation", "Brand Coordinator",                "Branch A",    "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00045", "Troy",      "T.", "Ferrer",     "EMP00029","Active", "Acme Corporation", "Content Writer",                   "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00046", "Uma",       "U.", "Padilla",    "EMP00029","Active", "Acme Corporation", "Content Writer",                   "Branch B",    "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00047", "Victor",    "V.", "Chua",       "EMP00029","Active", "Acme Corporation", "Copywriter",                       "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00048", "Wendy",     "W.", "dela Torre", "EMP00029","Active", "Acme Corporation", "Copywriter",                       "Branch A",    "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00049", "Xavier",    "X.", "Pascual",    "EMP00029","Active", "Acme Corporation", "Content Coordinator",              "Main Office", "MKT", "EMP00026", "Marketing & Communications"),
                new Employee("EMP00050", "Yolanda",   "Y.", "Reyes",      "EMP00029","Active", "Acme Corporation", "Content Coordinator",              "Branch B",    "MKT", "EMP00026", "Marketing & Communications"),
            });
            departments.Add(new Department("MKT", "Marketing & Communications", "EMP00026"));

            // ── FINANCE & ACCOUNTING ──────────────────────────────────────
            employees.AddRange(new[] {
                new Employee("EMP00051", "Ricardo",   "A.", "Tan",        null,      "Active", "Acme Corporation", "Chief Financial Officer",          "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00052", "Patricia",  "B.", "Lim",        "EMP00051","Active", "Acme Corporation", "Accounting Manager",               "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00053", "Antonio",   "C.", "Dela Cruz",  "EMP00051","Active", "Acme Corporation", "Financial Planning Manager",       "Branch A",    "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00054", "Beatrice",  "D.", "Cruz",       "EMP00052","Active", "Acme Corporation", "Senior Accountant",                "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00055", "Carlo",     "E.", "Santos",     "EMP00052","Active", "Acme Corporation", "Senior Accountant",                "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00056", "Dorothy",   "F.", "Reyes",      "EMP00052","Active", "Acme Corporation", "Accountant",                       "Branch A",    "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00057", "Ernesto",   "G.", "Bautista",   "EMP00052","Active", "Acme Corporation", "Accountant",                       "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00058", "Felicia",   "H.", "Lim",        "EMP00052","Active", "Acme Corporation", "Accountant",                       "Branch B",    "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00059", "Giovanni",  "I.", "Garcia",     "EMP00052","Active", "Acme Corporation", "Accounts Payable Specialist",      "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00060", "Helena",    "J.", "Torres",     "EMP00052","Active", "Acme Corporation", "Accounts Payable Specialist",      "Branch A",    "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00061", "Ignacio",   "K.", "Mendoza",    "EMP00052","Active", "Acme Corporation", "Accounts Receivable Specialist",   "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00062", "Julia",     "L.", "Ramos",      "EMP00052","Active", "Acme Corporation", "Accounts Receivable Specialist",   "Branch B",    "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00063", "Karl",      "M.", "Navarro",    "EMP00052","Active", "Acme Corporation", "Payroll Specialist",               "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00064", "Lucia",     "N.", "Castillo",   "EMP00052","Active", "Acme Corporation", "Payroll Specialist",               "Branch A",    "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00065", "Miguel",    "O.", "Villanueva", "EMP00052","Active", "Acme Corporation", "Tax Specialist",                   "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00066", "Nora",      "P.", "Soriano",    "EMP00052","Active", "Acme Corporation", "Finance Coordinator",              "Branch B",    "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00067", "Oscar",     "Q.", "Aquino",     "EMP00053","Active", "Acme Corporation", "Financial Analyst",                "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00068", "Penelope",  "R.", "Mercado",    "EMP00053","Active", "Acme Corporation", "Financial Analyst",                "Branch A",    "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00069", "Quirino",   "S.", "Hernandez",  "EMP00053","Active", "Acme Corporation", "Senior Financial Analyst",         "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00070", "Rebecca",   "T.", "Gutierrez",  "EMP00053","Active", "Acme Corporation", "Budget Analyst",                   "Branch B",    "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00071", "Sergio",    "U.", "Ong",        "EMP00053","Active", "Acme Corporation", "Budget Analyst",                   "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00072", "Tanya",     "V.", "Ferrer",     "EMP00053","Active", "Acme Corporation", "Treasury Analyst",                 "Branch A",    "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00073", "Ulrico",    "W.", "Padilla",    "EMP00053","Active", "Acme Corporation", "Treasury Analyst",                 "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00074", "Vivian",    "X.", "Chua",       "EMP00053","Active", "Acme Corporation", "FP&A Coordinator",                 "Branch B",    "FIN", "EMP00051", "Finance & Accounting"),
                new Employee("EMP00075", "William",   "Y.", "dela Torre", "EMP00053","Active", "Acme Corporation", "FP&A Coordinator",                 "Main Office", "FIN", "EMP00051", "Finance & Accounting"),
            });
            departments.Add(new Department("FIN", "Finance & Accounting", "EMP00051"));

            // ── HUMAN RESOURCES ───────────────────────────────────────────
            employees.AddRange(new[] {
                new Employee("EMP00076", "Isabela",   "A.", "Castillo",   null,      "Active", "Acme Corporation", "HR Director",                      "Main Office", "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00077", "Manuel",    "B.", "Reyes",      "EMP00076","Active", "Acme Corporation", "Talent Acquisition Manager",       "Main Office", "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00078", "Lourdes",   "C.", "Bautista",   "EMP00076","Active", "Acme Corporation", "HR Operations Manager",            "Branch A",    "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00079", "Nathan",    "D.", "Lim",        "EMP00077","Active", "Acme Corporation", "Senior Recruiter",                 "Main Office", "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00080", "Ophelia",   "E.", "Garcia",     "EMP00077","Active", "Acme Corporation", "Senior Recruiter",                 "Branch A",    "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00081", "Pedro",     "F.", "Torres",     "EMP00077","Active", "Acme Corporation", "Recruiter",                        "Main Office", "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00082", "Quina",     "G.", "Mendoza",    "EMP00077","Active", "Acme Corporation", "Recruiter",                        "Branch B",    "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00083", "Rosa",      "H.", "Ramos",      "EMP00077","Active", "Acme Corporation", "Recruiter",                        "Main Office", "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00084", "Stefan",    "I.", "Navarro",    "EMP00077","Active", "Acme Corporation", "Talent Sourcer",                   "Branch A",    "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00085", "Theresa",   "J.", "Dela Cruz",  "EMP00077","Active", "Acme Corporation", "Talent Sourcer",                   "Main Office", "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00086", "Uriel",     "K.", "Villanueva", "EMP00077","Active", "Acme Corporation", "Recruitment Coordinator",          "Branch B",    "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00087", "Veronica",  "L.", "Soriano",    "EMP00077","Active", "Acme Corporation", "Recruitment Coordinator",          "Main Office", "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00088", "Walter",    "M.", "Aquino",     "EMP00077","Active", "Acme Corporation", "Recruitment Coordinator",          "Branch A",    "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00089", "Ximena",    "N.", "Mercado",    "EMP00078","Active", "Acme Corporation", "HR Generalist",                    "Main Office", "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00090", "Yosef",     "O.", "Hernandez",  "EMP00078","Active", "Acme Corporation", "HR Generalist",                    "Branch A",    "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00091", "Zara",      "P.", "Gutierrez",  "EMP00078","Active", "Acme Corporation", "HR Generalist",                    "Branch B",    "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00092", "Arturo",    "Q.", "Ong",        "EMP00078","Active", "Acme Corporation", "Training Specialist",              "Main Office", "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00093", "Bella",     "R.", "Ferrer",     "EMP00078","Active", "Acme Corporation", "Training Specialist",              "Branch A",    "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00094", "Conrado",   "S.", "Padilla",    "EMP00078","Active", "Acme Corporation", "Employee Relations Specialist",    "Main Office", "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00095", "Delia",     "T.", "Chua",       "EMP00078","Active", "Acme Corporation", "Employee Relations Specialist",    "Branch B",    "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00096", "Efren",     "U.", "dela Torre", "EMP00078","Active", "Acme Corporation", "Compensation & Benefits Specialist","Main Office","HR", "EMP00076", "Human Resources"),
                new Employee("EMP00097", "Flora",     "V.", "Pascual",    "EMP00078","Active", "Acme Corporation", "Compensation & Benefits Specialist","Branch A",   "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00098", "Gerardo",   "W.", "Reyes",      "EMP00078","Active", "Acme Corporation", "HRIS Specialist",                  "Main Office", "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00099", "Herminia",  "X.", "Tan",        "EMP00078","Active", "Acme Corporation", "HR Coordinator",                   "Branch B",    "HR", "EMP00076", "Human Resources"),
                new Employee("EMP00100", "Ivan",      "Y.", "Lim",        "EMP00078","Active", "Acme Corporation", "HR Coordinator",                   "Main Office", "HR", "EMP00076", "Human Resources"),
            });
            departments.Add(new Department("HR", "Human Resources", "EMP00076"));

            // ── INFORMATION TECHNOLOGY — MAIN OFFICE ─────────────────────
            employees.AddRange(new[] {
                new Employee("EMP00101", "Michael",   "A.", "Navarro",    null,      "Active", "Acme Corporation", "IT Director",                      "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00102", "Francis",   "B.", "Aquino",     "EMP00101","Active", "Acme Corporation", "Systems & Infrastructure Manager", "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00103", "Christine", "C.", "Villanueva", "EMP00101","Active", "Acme Corporation", "Software Development Manager",     "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00105", "Jasmine",   "E.", "Mercado",    "EMP00102","Active", "Acme Corporation", "System Administrator",             "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP10000", "Kenneth",   "F.", "Hernandez",  "EMP00102","Active", "Acme Corporation", "Network Administrator",            "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00108", "Mario",     "H.", "Ong",        "EMP00102","Active", "Acme Corporation", "Database Administrator",           "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00110", "Oscar",     "J.", "Padilla",    "EMP00102","Active", "Acme Corporation", "Infrastructure Engineer",          "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00111", "Pamela",    "K.", "Chua",       "EMP00102","Active", "Acme Corporation", "Security Engineer",                "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00113", "Renato",    "M.", "Pascual",    "EMP00103","Active", "Acme Corporation", "Senior Software Engineer",         "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00114", "Shirley",   "N.", "Reyes",      "EMP00103","Active", "Acme Corporation", "Senior Software Engineer",         "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00116", "Ursula",    "P.", "Lim",        "EMP00103","Active", "Acme Corporation", "Software Engineer",                "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00118", "Wilda",     "R.", "Torres",     "EMP00103","Active", "Acme Corporation", "Junior Software Engineer",         "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00121", "Zachary",   "U.", "Navarro",    "EMP00104","Active", "Acme Corporation", "IT Support Specialist",            "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00123", "Belinda",   "W.", "Dela Cruz",  "EMP00104","Active", "Acme Corporation", "Help Desk Analyst",                "Main Office", "IT",     "EMP00101", "Information Technology"),
                new Employee("EMP00125", "Dolores",   "Y.", "Soriano",    "EMP00104","Active", "Acme Corporation", "Help Desk Analyst",                "Main Office", "IT",     "EMP00101", "Information Technology"),
            });
            departments.Add(new Department("IT", "Information Technology", "EMP00101"));

            // ── INFORMATION TECHNOLOGY — BRANCH A ────────────────────────
            employees.AddRange(new[] {
                new Employee("EMP00104", "Ronald",    "D.", "Soriano",    "EMP00101","Active", "Acme Corporation", "IT Support Manager",               "Branch A",    "IT_BRA", "EMP00104", "Information Technology"),
                new Employee("EMP10001", "John",      "F.", "Doe",        "EMP00102","Active", "Acme Corporation", "Network Administrator",            "Branch A",    "IT_BRA", "EMP00104", "Information Technology"),
                new Employee("EMP00107", "Lorena",    "G.", "Gutierrez",  "EMP00102","Active", "Acme Corporation", "Network Engineer",                 "Branch A",    "IT_BRA", "EMP00104", "Information Technology"),
                new Employee("EMP00112", "Quirino",   "L.", "dela Torre", "EMP00102","Active", "Acme Corporation", "Systems Engineer",                 "Branch A",    "IT_BRA", "EMP00104", "Information Technology"),
                new Employee("EMP00115", "Teofilo",   "O.", "Tan",        "EMP00103","Active", "Acme Corporation", "Software Engineer",                "Branch A",    "IT_BRA", "EMP00104", "Information Technology"),
                new Employee("EMP00119", "Xavier",    "S.", "Mendoza",    "EMP00103","Active", "Acme Corporation", "Junior Software Engineer",         "Branch A",    "IT_BRA", "EMP00104", "Information Technology"),
                new Employee("EMP00120", "Yolanda",   "T.", "Ramos",      "EMP00104","Active", "Acme Corporation", "IT Support Specialist",            "Branch A",    "IT_BRA", "EMP00104", "Information Technology"),
                new Employee("EMP00124", "Celestino", "X.", "Villanueva", "EMP00104","Active", "Acme Corporation", "Help Desk Analyst",                "Branch A",    "IT_BRA", "EMP00104", "Information Technology"),
            });
            departments.Add(new Department("IT_BRA", "Information Technology", "EMP00104"));

            // ── INFORMATION TECHNOLOGY — BRANCH B ────────────────────────
            employees.AddRange(new[] {
                new Employee("EMP10002", "Ako",       "I.", "Cutie",      "EMP00102","Active", "Acme Corporation", "Network Administrator",            "Branch B",    "IT_BRB", "EMP10002", "Information Technology"),
                new Employee("EMP00109", "Noreen",    "I.", "Ferrer",     "EMP00102","Active", "Acme Corporation", "Database Administrator",           "Branch B",    "IT_BRB", "EMP10002", "Information Technology"),
                new Employee("EMP00117", "Victor",    "Q.", "Garcia",     "EMP00103","Active", "Acme Corporation", "Software Engineer",                "Branch B",    "IT_BRB", "EMP10002", "Information Technology"),
                new Employee("EMP00122", "Alberto",   "V.", "Castillo",   "EMP00104","Active", "Acme Corporation", "IT Support Specialist",            "Branch B",    "IT_BRB", "EMP10002", "Information Technology"),
            });
            departments.Add(new Department("IT_BRB", "Information Technology", "EMP10002"));

            // ── OPERATIONS ────────────────────────────────────────────────
            employees.AddRange(new[] {
                new Employee("EMP00126", "Eduardo",   "A.", "Mercado",    null,      "Active", "Acme Corporation", "Chief Operating Officer",          "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00127", "Grace",     "B.", "Domingo",    "EMP00126","Active", "Acme Corporation", "Process Improvement Manager",      "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00128", "Bernard",   "C.", "Hernandez",  "EMP00126","Active", "Acme Corporation", "Facilities Manager",               "Branch A",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00129", "Helen",     "D.", "Gutierrez",  "EMP00127","Active", "Acme Corporation", "Senior Operations Analyst",        "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00130", "Isidro",    "E.", "Ong",        "EMP00127","Active", "Acme Corporation", "Operations Analyst",               "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00131", "Josephine", "F.", "Ferrer",     "EMP00127","Active", "Acme Corporation", "Operations Analyst",               "Branch A",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00132", "Kristoffer","G.", "Padilla",    "EMP00127","Active", "Acme Corporation", "Operations Analyst",               "Branch B",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00133", "Leonora",   "H.", "Chua",       "EMP00127","Active", "Acme Corporation", "Process Analyst",                  "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00134", "Marvin",    "I.", "dela Torre", "EMP00127","Active", "Acme Corporation", "Process Analyst",                  "Branch A",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00135", "Natalie",   "J.", "Pascual",    "EMP00127","Active", "Acme Corporation", "Process Coordinator",              "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00136", "Orlando",   "K.", "Reyes",      "EMP00127","Active", "Acme Corporation", "Operations Coordinator",           "Branch B",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00137", "Phoebe",    "L.", "Tan",        "EMP00127","Active", "Acme Corporation", "Operations Coordinator",           "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00138", "Quentin",   "M.", "Lim",        "EMP00127","Active", "Acme Corporation", "Quality Analyst",                  "Branch A",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00139", "Rowena",    "N.", "Garcia",     "EMP00127","Active", "Acme Corporation", "Quality Analyst",                  "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00140", "Salvador",  "O.", "Torres",     "EMP00127","Active", "Acme Corporation", "Logistics Coordinator",            "Branch B",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00141", "Theresa",   "P.", "Mendoza",    "EMP00127","Active", "Acme Corporation", "Logistics Coordinator",            "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00142", "Ulysses",   "Q.", "Ramos",      "EMP00128","Active", "Acme Corporation", "Facilities Coordinator",           "Branch A",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00143", "Virginia",  "R.", "Navarro",    "EMP00128","Active", "Acme Corporation", "Facilities Coordinator",           "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00144", "Wenceslao", "S.", "Castillo",   "EMP00128","Active", "Acme Corporation", "Facilities Technician",            "Branch A",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00145", "Xyza",      "T.", "Dela Cruz",  "EMP00128","Active", "Acme Corporation", "Facilities Technician",            "Branch B",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00146", "Yasmin",    "U.", "Villanueva", "EMP00128","Active", "Acme Corporation", "Administrative Coordinator",       "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00147", "Zoilo",     "V.", "Soriano",    "EMP00128","Active", "Acme Corporation", "Administrative Coordinator",       "Branch A",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00148", "Amelia",    "W.", "Aquino",     "EMP00128","Active", "Acme Corporation", "Administrative Assistant",         "Main Office", "OPS", "EMP00126", "Operations"),
                new Employee("EMP00149", "Bonifacio", "X.", "Mercado",    "EMP00128","Active", "Acme Corporation", "Administrative Assistant",         "Branch B",    "OPS", "EMP00126", "Operations"),
                new Employee("EMP00150", "Carla",     "Y.", "Hernandez",  "EMP00128","Active", "Acme Corporation", "Administrative Assistant",         "Branch A",    "OPS", "EMP00126", "Operations"),
            });
            departments.Add(new Department("OPS", "Operations", "EMP00126"));

            // ── LEGAL & COMPLIANCE ────────────────────────────────────────
            employees.AddRange(new[] {
                new Employee("EMP00151", "Victoria",  "A.", "Gutierrez",  null,      "Active", "Acme Corporation", "General Counsel",                  "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00152", "Kenneth",   "B.", "Ong",        "EMP00151","Active", "Acme Corporation", "Contracts Manager",                "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00153", "Maricel",   "C.", "Ferrer",     "EMP00151","Active", "Acme Corporation", "Compliance Manager",               "Branch A",    "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00154", "Diego",     "D.", "Padilla",    "EMP00152","Active", "Acme Corporation", "Senior Legal Counsel",             "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00155", "Evangeline","E.", "Chua",       "EMP00152","Active", "Acme Corporation", "Legal Counsel",                    "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00156", "Francisco", "F.", "dela Torre", "EMP00152","Active", "Acme Corporation", "Legal Counsel",                    "Branch A",    "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00157", "Graciela",  "G.", "Pascual",    "EMP00152","Active", "Acme Corporation", "Contracts Specialist",             "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00158", "Herminio",  "H.", "Reyes",      "EMP00152","Active", "Acme Corporation", "Contracts Specialist",             "Branch B",    "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00159", "Ines",      "I.", "Tan",        "EMP00152","Active", "Acme Corporation", "Contracts Specialist",             "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00160", "Jaime",     "J.", "Lim",        "EMP00152","Active", "Acme Corporation", "Contracts Administrator",          "Branch A",    "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00161", "Kristine",  "K.", "Garcia",     "EMP00152","Active", "Acme Corporation", "Contracts Administrator",          "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00162", "Lorenzo",   "L.", "Torres",     "EMP00152","Active", "Acme Corporation", "Paralegal",                        "Branch B",    "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00163", "Magdalena", "M.", "Mendoza",    "EMP00152","Active", "Acme Corporation", "Paralegal",                        "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00164", "Nicolas",   "N.", "Ramos",      "EMP00153","Active", "Acme Corporation", "Senior Compliance Analyst",        "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00165", "Ofelia",    "O.", "Navarro",    "EMP00153","Active", "Acme Corporation", "Compliance Analyst",               "Branch A",    "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00166", "Pablo",     "P.", "Castillo",   "EMP00153","Active", "Acme Corporation", "Compliance Analyst",               "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00167", "Quirina",   "Q.", "Dela Cruz",  "EMP00153","Active", "Acme Corporation", "Compliance Analyst",               "Branch B",    "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00168", "Rodolfo",   "R.", "Villanueva", "EMP00153","Active", "Acme Corporation", "Regulatory Affairs Specialist",    "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00169", "Soledad",   "S.", "Soriano",    "EMP00153","Active", "Acme Corporation", "Regulatory Affairs Specialist",    "Branch A",    "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00170", "Teodoro",   "T.", "Aquino",     "EMP00153","Active", "Acme Corporation", "Data Privacy Officer",             "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00171", "Ursula",    "U.", "Mercado",    "EMP00153","Active", "Acme Corporation", "Risk Analyst",                     "Branch B",    "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00172", "Victorino", "V.", "Hernandez",  "EMP00153","Active", "Acme Corporation", "Risk Analyst",                     "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00173", "Wilhelmina","W.", "Gutierrez",  "EMP00153","Active", "Acme Corporation", "Compliance Coordinator",           "Branch A",    "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00174", "Xenia",     "X.", "Ong",        "EMP00153","Active", "Acme Corporation", "Compliance Coordinator",           "Main Office", "LEGAL", "EMP00151", "Legal & Compliance"),
                new Employee("EMP00175", "Yasmeen",   "Y.", "Ferrer",     "EMP00153","Active", "Acme Corporation", "Legal Coordinator",                "Branch B",    "LEGAL", "EMP00151", "Legal & Compliance"),
            });
            departments.Add(new Department("LEGAL", "Legal & Compliance", "EMP00151"));

            // ── CUSTOMER SERVICE ──────────────────────────────────────────
            employees.AddRange(new[] {
                new Employee("EMP00176", "Rosario",   "A.", "Padilla",    null,      "Active", "Acme Corporation", "Customer Service Director",        "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00177", "Albert",    "B.", "Chua",       "EMP00176","Active", "Acme Corporation", "Customer Support Manager",         "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00178", "Jennifer",  "C.", "dela Torre", "EMP00176","Active", "Acme Corporation", "Customer Success Manager",         "Branch A",    "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00179", "Zacharias", "D.", "Pascual",    "EMP00177","Active", "Acme Corporation", "Senior Customer Service Rep",      "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00180", "Amelia",    "E.", "Reyes",      "EMP00177","Active", "Acme Corporation", "Senior Customer Service Rep",      "Branch A",    "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00181", "Benedicto", "F.", "Tan",        "EMP00177","Active", "Acme Corporation", "Customer Service Representative",  "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00182", "Catalina",  "G.", "Lim",        "EMP00177","Active", "Acme Corporation", "Customer Service Representative",  "Branch B",    "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00183", "Damian",    "H.", "Garcia",     "EMP00177","Active", "Acme Corporation", "Customer Service Representative",  "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00184", "Estela",    "I.", "Torres",     "EMP00177","Active", "Acme Corporation", "Customer Service Representative",  "Branch A",    "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00185", "Feliciano", "J.", "Mendoza",    "EMP00177","Active", "Acme Corporation", "Customer Service Representative",  "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00186", "Gilberto",  "K.", "Ramos",      "EMP00177","Active", "Acme Corporation", "Customer Service Associate",       "Branch B",    "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00187", "Hortensia", "L.", "Navarro",    "EMP00177","Active", "Acme Corporation", "Customer Service Associate",       "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00188", "Irene",     "M.", "Castillo",   "EMP00177","Active", "Acme Corporation", "Customer Service Associate",       "Branch A",    "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00189", "Julian",    "N.", "Dela Cruz",  "EMP00177","Active", "Acme Corporation", "Customer Service Associate",       "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00190", "Karla",     "O.", "Villanueva", "EMP00178","Active", "Acme Corporation", "Customer Success Specialist",      "Branch A",    "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00191", "Leandro",   "P.", "Soriano",    "EMP00178","Active", "Acme Corporation", "Customer Success Specialist",      "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00192", "Milagros",  "Q.", "Aquino",     "EMP00178","Active", "Acme Corporation", "Customer Success Specialist",      "Branch B",    "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00193", "Narciso",   "R.", "Mercado",    "EMP00178","Active", "Acme Corporation", "Customer Success Specialist",      "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00194", "Otilia",    "S.", "Hernandez",  "EMP00178","Active", "Acme Corporation", "Customer Success Analyst",         "Branch A",    "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00195", "Patricio",  "T.", "Gutierrez",  "EMP00178","Active", "Acme Corporation", "Customer Success Analyst",         "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00196", "Queenie",   "U.", "Ong",        "EMP00178","Active", "Acme Corporation", "Customer Retention Specialist",    "Branch B",    "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00197", "Renaldo",   "V.", "Ferrer",     "EMP00178","Active", "Acme Corporation", "Customer Retention Specialist",    "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00198", "Simona",    "W.", "Padilla",    "EMP00178","Active", "Acme Corporation", "Onboarding Specialist",            "Branch A",    "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00199", "Teodulo",   "X.", "Chua",       "EMP00178","Active", "Acme Corporation", "Onboarding Specialist",            "Main Office", "CS", "EMP00176", "Customer Service"),
                new Employee("EMP00200", "Ulrica",    "Y.", "dela Torre", "EMP00178","Active", "Acme Corporation", "Customer Success Coordinator",     "Branch B",    "CS", "EMP00176", "Customer Service"),
            });
            departments.Add(new Department("CS", "Customer Service", "EMP00176"));

            context.Employees.AddRange(employees);
            context.Departments.AddRange(departments);
            await context.SaveChangesAsync();
        }
    }
}
