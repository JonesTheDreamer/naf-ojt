//using NAFServer.src.Application.DTOs.NAF;
//using NAFServer.src.Application.DTOs.ResourceRequest;
//using NAFServer.src.Application.Interfaces;

//namespace NAFServer.src.Infrastructure.Persistence.Seeder
//{
//    public class NAFSeeder
//    {
//        public static async Task SeedAsync(AppDbContext context, IServiceProvider serviceProvider)
//        {
//            if (!context.NAFs.Any())
//            {
//                using var scope = serviceProvider.CreateScope();
//                var naf = scope.ServiceProvider.GetRequiredService<INAFService>();

//                await naf.CreateAsync(new CreateNAFRequestDTO
//                (
//                    "9081429",
//                    "9219587",
//                    new List<CreateResourceRequestFromAPIDTO>([
//                        new CreateResourceRequestFromAPIDTO
//                        (
//                            3,
//                            "Need access to the vpn for browsing"
//                        ),
//                        ])
//                ));
//                await naf.CreateAsync(new CreateNAFRequestDTO
//                (
//                    "9329765",
//                    "9219587",
//                    new List<CreateResourceRequestFromAPIDTO>([
//                        new CreateResourceRequestFromAPIDTO
//                        (
//                            1,
//                            "Need access to the internet for research purposes"
//                        ),
//                        new CreateResourceRequestFromAPIDTO
//                        (
//                            3,
//                            "Need access to the vpn for browsing"
//                        ),

//                        ])
//                ));
//                await naf.CreateAsync(new CreateNAFRequestDTO
//                (
//                    "9081321",
//                    "9219587",
//                    new List<CreateResourceRequestFromAPIDTO>([
//                        new CreateResourceRequestFromAPIDTO
//                        (
//                            2,
//                            "Need access to the email for marketing purposes"
//                        ),
//                        ])
//                ));
//                await naf.CreateAsync(new CreateNAFRequestDTO
//                (
//                    "9081461",
//                    "9219587",
//                    new List<CreateResourceRequestFromAPIDTO>([
//                        new CreateResourceRequestFromAPIDTO
//                        (
//                            1,
//                            "Need access to the internet for research purposes"
//                        ),
//                        ])
//                ));
//                //await context.SaveChangesAsync();
//            }
//        }
//    }
//}
