using Microsoft.AspNetCore.Mvc;

namespace CollaborationStateService.Controllers
{
    [Route( "api/[controller]" )]
    public class InfoController : Controller
    {
        // GET api/info
        [HttpGet]
        public string Get()
        {
            return "Hello World!";
        }
    }
}
