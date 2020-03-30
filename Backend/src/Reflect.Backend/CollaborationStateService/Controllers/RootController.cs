using Microsoft.AspNetCore.Mvc;

namespace CollaborationStateService.Controllers
{
    [Route("")]
    public class RootController : Controller
    {
        // GET /
        [HttpGet]
        public IActionResult Get()
        {
            // Return 200 for default route since it is called regularly for the 
            // Azure Web App Always On feature
            return Ok();
        }
    }
}
