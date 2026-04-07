using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Infrastructure.Persistence.Seeder
{
    public class InternetResourceSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (context.InternetResources.Any()) return;

            var socialMedia = new InternetPurpose("Social Media", "Use of internet for social media purposes");
            var highBandwidth = new InternetPurpose("High Bandwidths", "Use of high bandwidth internet services");
            var ai = new InternetPurpose("Social Media", "Use of internet for artificial intelligence");

            context.InternetPurposes.AddRange(socialMedia, highBandwidth, ai);
            await context.SaveChangesAsync();

            var facebook = new InternetResource("Facebook", "https://facebook.com", "Social media mainly used for advertising and communication of the company", 1);
            var x = new InternetResource("X", "https://x.com", "Social media mainly used for advertising and communication of the company", 1);
            var whatsApp = new InternetResource("WhatsApp", "https://whatsapp.com", "Social media mainly used for communication of the company", 1);

            var youtube = new InternetResource("Youtube", "https://youtube.com", "Used for streaming videos", 2);
            var spotify = new InternetResource("Spotify", "https://spotify.com", "Used for streaming music", 2);

            var chatGPT = new InternetResource("ChatGPT", "https://chatgpt.com", "AI used for company purposes", 3);
            var gemini = new InternetResource("Gemini", "https://gemini.google.com", "AI used for company purposes", 3);

            context.InternetResources.AddRange(facebook, x, whatsApp, youtube, spotify, chatGPT, gemini);
            await context.SaveChangesAsync();
        }
    }
}
