using BLL.ModelVM.Message;
using BLL.ModelVM.Response;
using BLL.Services.Abstractions;
using DAL.Repo.Abstraction;
using DAL.Entities;
using AutoMapper;

namespace BLL.Services.Impelementation
{
 public class MessageService : IMessageService
 {
 private readonly IUnitOfWork _uow;
 private readonly IMapper _mapper;
 public MessageService(IUnitOfWork uow, IMapper mapper)
 {
 _uow = uow;
 _mapper = mapper;
 }

 public async Task<Response<CreateMessageVM>> CreateAsync(CreateMessageVM model)
 {
 try
 {
 var entity = DAL.Entities.Message.Create(model.SenderId, model.ReceiverId, model.Content, DateTime.UtcNow, false);
 await _uow.Messages.AddAsync(entity);
 await _uow.SaveChangesAsync();
 return new Response<CreateMessageVM>(model, null, false);
 }
 catch (Exception ex)
 {
 return new Response<CreateMessageVM>(null, ex.Message, true);
 }
 }

 public async Task<Response<List<GetMessageVM>>> GetConversationAsync(Guid userId1, Guid userId2)
 {
 try
 {
 var result = await _uow.Messages.GetConversationAsync(userId1, userId2);
 var mapped = _mapper.Map<List<GetMessageVM>>(result);
 return new Response<List<GetMessageVM>>(mapped, null, false);
 }
 catch (Exception ex)
 {
 return new Response<List<GetMessageVM>>(null, ex.Message, true);
 }
 }

 public async Task<Response<List<GetMessageVM>>> GetUnreadAsync(Guid receiverId)
 {
 try
 {
 var result = await _uow.Messages.GetUnreadMessagesAsync(receiverId);
 var mapped = _mapper.Map<List<GetMessageVM>>(result);
 return new Response<List<GetMessageVM>>(mapped, null, false);
 }
 catch (Exception ex)
 {
 return new Response<List<GetMessageVM>>(null, ex.Message, true);
 }
 }
 }
}
